import gulp from 'gulp';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import cleanCSS from 'gulp-clean-css';
import * as sassCompiler from 'sass';
import gulpSass from 'gulp-sass';
import { rimraf } from 'rimraf';
import zip from 'gulp-zip';
import prettier from 'gulp-prettier';
import rename from 'gulp-rename';
import stylelint from 'gulp-stylelint-esm';
import path from 'path';
import { exec } from 'gulp-execa';
import jsonTransform from 'gulp-json-transform';
import fs from 'fs';

/*---------------------------------------------- Configs ---------------------------------------------*/

// Read the version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json'));
const version = packageJson.version;

// Configure gulp-sass to use the Sass compiler
const sassCompilerInstance = gulpSass(sassCompiler);

// Paths
const paths = {
  temp: 'temp',
  src: 'src',
  dist: 'dist',
  srcGlob: 'src/**/*',
  sassGlob: 'styles/**/*.scss',
  cssGlob: 'styles/css-built/**/*.css',
  sassSrc: 'styles',
  cssDest: 'styles/css-built',
  chromeManifest: 'manifest.json',
  firefoxManifest: 'manifest_firefox.json',
  defaultManifestName: 'manifest.json',
  uncompressedImages: `images/foil/uncompressed`
};

/*------------------------------------------ Version Syncing -----------------------------------------*/

// Task to update the version in both manifest files
gulp.task('sync-manifest-version', function() {
  const manifests = [`${paths.src}/${paths.chromeManifest}`, `${paths.src}/${paths.firefoxManifest}`];

  // Process each manifest file
  return gulp.src(manifests)
    .pipe(jsonTransform(function(data) {
      data.version = version;
      return data;
    }, 2))
    .pipe(gulp.dest('./src'));
});

/*--------------------------------------- File / Folder Cleaning -------------------------------------*/

// Clean task
gulp.task('clean', async () => {
  await rimraf(paths.dist);
  await rimraf(paths.temp);
});

// Cleanup temp folder
gulp.task('clean-temp', () => rimraf(paths.temp));

/*----------------------------------------------- Sass -----------------------------------------------*/

// Process SCSS files in temp directory and output to specific directories
gulp.task('process-sass', (done) => {
  const isWatch = process.env.NODE_ENV === 'watch';
  const destPath = isWatch ? `${paths.src}/${paths.cssDest}` : `${paths.temp}/${paths.cssDest}`;
  const srcGlob = isWatch ? `${paths.src}/${paths.sassGlob}` : `${paths.temp}/${paths.sassGlob}`;

  return gulp.src(srcGlob)
    .pipe(sassCompilerInstance().on('error', sassCompilerInstance.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest(destPath))
    .on('end', done);
});

// Process CSS files (autoprefixing and minifying)
gulp.task('process-css', (done) => {
  const isWatch = process.env.NODE_ENV === 'watch';
  if (isWatch) return done(); // Skip minification in watch mode

  return gulp.src(`${paths.temp}/${paths.cssGlob}`)
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS())
    .pipe(gulp.dest(`${paths.temp}/${paths.cssDest}`))
    .on('end', done);
});

/*--------------------------------------------- Prettier ---------------------------------------------*/

// Run Prettier in check mode only (for watch task)
gulp.task('prettier-check', () => {
  const isWatch = process.env.NODE_ENV === 'watch';
  const root = isWatch ? `${paths.src}` : `${paths.temp}`;

  return gulp.src([
    `${root}/**/*.js`,
    `${root}/**/*.scss`,
    `${root}/**/*.html`
  ])
    .pipe(prettier.check())
    .on('error', function (err) {
      console.error('Prettier check failed:', err.message);
      this.emit('end');
    });
});

// Run Prettier on files (default task)
gulp.task('prettier', () => {
  const isWatch = process.env.NODE_ENV === 'watch';
  const root = isWatch ? `${paths.src}` : `${paths.temp}`;

  return gulp.src([
    `${root}/**/*.js`,
    `${root}/**/*.scss`,
    `${root}/**/*.html`
  ])
    .pipe(prettier())
    .pipe(gulp.dest((file) => file.base));
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
  return gulp.src(`${paths.src}/${paths.cssGlob}`)
    .pipe(stylelint({
      fix: true, // Fixes code style issues, but not errors
      configFile: path.resolve('.stylelint.config.mjs'),
      reporters: [{ formatter: 'string', console: true }],
    }));
});

/*-------------------------------------------- File Move --------------------------------------------*/

// Copy all files to temp directory
gulp.task('copy-files-to-temp', () => {
  return gulp.src(paths.srcGlob)
    .pipe(gulp.dest(paths.temp));
});

// Move files from temp to dist folders, handling manifests separately
gulp.task('move-files-to-dist', () => {
  const globPatterns = [
    `${paths.temp}/**/*`,
    `!${paths.temp}/${paths.chromeManifest}`,
    `!${paths.temp}/${paths.firefoxManifest}`,
    `!${paths.temp}/${paths.uncompressedImages}/**/*`,
    `!${paths.temp}/**/Thumbs.db`
  ];

  return gulp.src(globPatterns)
    .pipe(gulp.dest(`${paths.dist}/chrome`))
    .pipe(gulp.src(globPatterns)
    .pipe(gulp.dest(`${paths.dist}/firefox`)))
    .on('end', () => {
      gulp.src(`${paths.temp}/${paths.chromeManifest}`)
        .pipe(rename(paths.defaultManifestName))
        .pipe(gulp.dest(`${paths.dist}/chrome`));
      gulp.src(`${paths.temp}/${paths.firefoxManifest}`)
        .pipe(rename(paths.defaultManifestName))
        .pipe(gulp.dest(`${paths.dist}/firefox`));

      rimraf(`${paths.dist}/chrome/images/foil/uncompressed`);
      rimraf(`${paths.dist}/firefox/images/foil/uncompressed`);
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

// Watch tasks
gulp.task('watch-styles', () => {
  process.env.NODE_ENV = 'watch';
  gulp.watch(`${paths.src}/${paths.sassGlob}`, gulp.series('process-sass', 'stylelint-watch'));
});

gulp.task('watch-code', () => {
  process.env.NODE_ENV = 'watch';
  gulp.watch([`${paths.src}/**/*.js`, `${paths.src}/**/*.html`], gulp.series('prettier-check', 'eslint-watch'));
});

gulp.task('watch', gulp.parallel('watch-styles', 'watch-code'));

// One-time lint and css build/processing task (alternative for watching)
gulp.task('lint-and-convert-once', (done) => {
  process.env.NODE_ENV = 'watch';

  gulp.series(
    gulp.series('process-sass', 'stylelint-watch'), // Process SCSS and run Stylelint
    gulp.series('prettier', 'eslint-watch') // Run Prettier check and ESLint
  )(done);
});

// One-time sass conversion of src folder styles
gulp.task('process-css-once', (done) => {
  process.env.NODE_ENV = 'watch';

  gulp.series(
    gulp.series('process-sass')
  )(done);
});

// Build-dist task ( use "gulp build-dist --skip-cleanup" to skip the folder deletions)
gulp.task('build-dist', (done) => {
  const skipCleanup = process.argv.includes('--skip-cleanup');

  gulp.series(
    'sync-manifest-version',
    'clean',
    'copy-files-to-temp',
    'process-sass',
    'process-css',
    //'prettier',
    //'eslint',
    'move-files-to-dist',
    'zip',
    'clean-temp'
  )(function (err) {
    if (err) {
      console.error('Error during build:', err.message);
      if (!skipCleanup) {
        gulp.series('clean')(done);
      } else {
        done(err);
      }
    } else {
      done();
    }
  });
});

// Default task for one-time processing
gulp.task('default', gulp.series('lint-and-convert-once'));
