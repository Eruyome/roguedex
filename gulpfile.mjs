import gulp from 'gulp';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import cleanCSS from 'gulp-clean-css';
import * as sassCompiler from 'sass';
import gulpSass from 'gulp-sass';
import fs from 'fs-extra';
import zip from 'gulp-zip';
import prettier from 'gulp-prettier';
import rename from 'gulp-rename';
import stylelint from 'gulp-stylelint-esm';
import path from 'path'; // Import path module
import { exec } from 'gulp-execa';

// Configure gulp-sass to use the Sass compiler
const sassCompilerInstance = gulpSass(sassCompiler);

// Paths
const paths = {
  srcGlob: 'src/**/*',
  styles: 'src/styles/**/*.scss',
  temp: 'temp',
  src: 'src',
  dist: 'dist',
  chromeManifest: 'manifest.json',
  firefoxManifest: 'manifest_firefox.json',
  defaultManifestName: 'manifest.json',
};

// Clean task
gulp.task('clean', () => fs.remove(paths.dist).then(() => fs.remove(paths.temp)));

// Cleanup temp folder
gulp.task('clean-temp', () => fs.remove(paths.temp));

// Copy all files to temp directory
gulp.task('copy-files-to-temp', () => {
  return gulp.src(paths.srcGlob)
    .pipe(gulp.dest(paths.temp));
});

/*----------------------------------------------- Sass -----------------------------------------------*/

// Process SCSS files in temp directory and output to specific directories
gulp.task('process-sass', (done) => {
  const isWatch = process.env.NODE_ENV === 'watch';
  const destPath = isWatch ? 'src/styles/css-built' : `${paths.temp}/styles/css-built`;

  return gulp.src(isWatch ? paths.styles : `${paths.temp}/styles/**/*.scss`)
    .pipe(sassCompilerInstance().on('error', sassCompilerInstance.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(isWatch ? gulp.dest(destPath) : gulp.dest(`${paths.temp}/styles/css-built`))
    .on('end', done);
});

// Process CSS files (autoprefixing and minifying)
gulp.task('process-css', (done) => {
  const isWatch = process.env.NODE_ENV === 'watch';
  if (isWatch) return done(); // Skip minification in watch mode

  return gulp.src(`${paths.temp}/styles/css-built/**/*.css`)
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS())
    .pipe(gulp.dest(`${paths.temp}/styles/css-built`))
    .on('end', done);
});

/*--------------------------------------------- Prettier ---------------------------------------------*/

// Run Prettier in check mode only (for watch task)
gulp.task('prettier-check', () => {
  const isWatch = process.env.NODE_ENV === 'watch';
  const root = isWatch ? `${paths.src}` : `${paths.temp}`;

  return gulp.src([
    `${root}/**/*.js`, // JavaScript files
    `${root}/**/*.scss`, // SCSS files
    `${root}/**/*.html` // HTML files
  ])
    .pipe(prettier.check())
    .on('error', function (err) {
      console.error('Prettier check failed:', err.message);
      this.emit('end'); // Continue with the next tasks
    });
});

// Run Prettier on files (default task)
gulp.task('prettier', () => {
  const isWatch = process.env.NODE_ENV === 'watch';
  const root = isWatch ? `${paths.src}` : `${paths.temp}`;

  return gulp.src([
    `${root}/**/*.js`, // JavaScript files
    `${root}/**/*.scss`, // SCSS files
    `${root}/**/*.html` // HTML files
  ])
    .pipe(prettier())
    .pipe(gulp.dest((file) => file.base));
});

// Run ESLint with limited auto-fix for watch task
gulp.task('eslint-watch_old', () => {
  return gulp.src(`${paths.src}/**/*.js`)
    .pipe(exec('npx eslint --config eslint.config.mjs'))
    .pipe(exec.reporter());
});

/*---------------------------------------------- ESLint ----------------------------------------------*/

// Function to run ESLint
const runEslint = async (files, options) => {
  const command = `npx eslint "${files}" --config eslint.config.mjs ${options}`;
  try {
    const { stdout, stderr } = await exec(command, { shell: true });
    console.log('ESLint output:', stdout);
    if (stderr) {
      console.error('ESLint stderr:', stderr);
    }
  } catch (error) {
    console.error('Error running ESLint:', error.message);
    process.exit(1);
  }
};

// One-time ESLint task
gulp.task('eslint', () => {
  const files = `${paths.temp}/**/*.js`;
  return runEslint(files, '--no-cache --fix');
});

// Watch task for ESLint
gulp.task('eslint-watch', () => {
  watch(`${paths.src}/**/*.js`, (done) => {
    runEslint(`${paths.src}/**/*.js`, '');
    done(); // Signal completion of the task
  });
});

/*-------------------------------------------- Stylelint --------------------------------------------*/

// Run Stylelint with limited auto-fix for watch task
gulp.task('stylelint-watch', () => {
  return gulp.src(paths.styles)
    .pipe(stylelint({
      fix: true, // Fixes code style issues, but not errors
      configFile: path.resolve('.stylelint.config.mjs'),
      reporters: [{ formatter: 'string', console: true }],
    }));
});

/*-------------------------------------------- File Move --------------------------------------------*/

// Move files from temp to dist folders, handling manifests separately
gulp.task('move-files-to-dist', () => {
  return gulp.src([
      `${paths.temp}/**/*`, // All files in temp directory
      `!${paths.temp}/${paths.chromeManifest}`, // Exclude Chrome manifest
      `!${paths.temp}/${paths.firefoxManifest}` // Exclude Firefox manifest
    ])
    .pipe(gulp.dest(`${paths.dist}/chrome`))
    .pipe(gulp.src([
        `${paths.temp}/**/*`,
        `!${paths.temp}/${paths.chromeManifest}`,
        `!${paths.temp}/${paths.firefoxManifest}`
      ])
      .pipe(gulp.dest(`${paths.dist}/firefox`)))
    .on('end', () => {
      gulp.src(`${paths.temp}/${paths.chromeManifest}`)
        .pipe(rename(paths.defaultManifestName))
        .pipe(gulp.dest(`${paths.dist}/chrome`));
      gulp.src(`${paths.temp}/${paths.firefoxManifest}`)
        .pipe(rename(paths.defaultManifestName))
        .pipe(gulp.dest(`${paths.dist}/firefox`));
    });
});

/*--------------------------------------------- Folder Zip -------------------------------------------*/

// Zip the dist folders
gulp.task('zip', () => {
  return Promise.all([
    gulp.src('dist/chrome/**/*')
      .pipe(zip('chrome-extension.zip'))
      .pipe(gulp.dest('dist')),
    gulp.src('dist/firefox/**/*')
      .pipe(zip('firefox-extension.zip'))
      .pipe(gulp.dest('dist'))
  ]);
});

/*--------------------------------------------- Main Tasks -------------------------------------------*/

// Watch task
gulp.task('watch', () => {
  process.env.NODE_ENV = 'watch'; // Set environment variable

  gulp.watch(paths.styles, gulp.series('process-sass', 'stylelint-watch')); // Process SCSS and Stylelint
  gulp.watch([`${paths.src}/**/*.js`, `${paths.src}/**/*.html`], gulp.series('prettier-check', 'eslint-watch'));
});

// One-time lint and build task (alternative for watching)
gulp.task('lint-and-build-once', (done) => {
  // Set environment variable to watch
  process.env.NODE_ENV = 'watch';

  gulp.series(
    gulp.series('process-sass', 'stylelint-watch'), // Process SCSS and run Stylelint
    gulp.series('prettier', 'eslint-watch') // Run Prettier check and ESLint
  )(done);
});

// One-time sass conversion of src folder styles
gulp.task('process-sass-once', (done) => {
  // Set environment variable to watch
  process.env.NODE_ENV = 'watch';

  gulp.series(
    gulp.series('process-sass')
  )(done);
});

// Build-dist task
gulp.task('build-dist', gulp.series(
  'clean',
  'copy-files-to-temp',
  'process-sass',
  'process-css',
  'prettier',
  'eslint',
  'move-files-to-dist',
  'zip',
  'clean-temp'
));

// Default task for one-time processing
gulp.task('default', gulp.series('lint-and-build-once'));
