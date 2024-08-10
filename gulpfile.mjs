/*----------------------------------------------------------------------------------------------------*/
/*                                              Imports                                               */
/*----------------------------------------------------------------------------------------------------*/

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

/*----------------------------------------------------------------------------------------------------*/
/*                                              Configs                                               */
/*----------------------------------------------------------------------------------------------------*/

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
  distChrome: 'roguedex-chrome',
  distFirefox: 'roguedex-firefox',
  chromeManifest: 'manifest.json',
  firefoxManifest: 'manifest_firefox.json',
  defaultManifestName: 'manifest.json',
  uncompressedImages: `images/foil/uncompressed`
};

/*----------------------------------------------------------------------------------------------------*/
/*                                            Version Sync                                            */
/*----------------------------------------------------------------------------------------------------*/

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

/*----------------------------------------------------------------------------------------------------*/
/*                                       File / Folder Cleaning                                       */
/*----------------------------------------------------------------------------------------------------*/

gulp.task('clean', () => {
  return Promise.all([
    rimraf(paths.dist),
    rimraf(paths.temp)
  ]);
});

// Cleanup temp folder
gulp.task('clean-temp', () => rimraf(paths.temp));

/*----------------------------------------------------------------------------------------------------*/
/*                                                Sass                                                */
/*----------------------------------------------------------------------------------------------------*/

// Process SCSS files in temp directory and output to specific directories
gulp.task('process-sass', () => {
  const isWatch = process.env.NODE_ENV === 'watch';
  const destPath = isWatch ? `${paths.src}/${paths.cssDest}` : `${paths.temp}/${paths.cssDest}`;
  const srcGlob = isWatch ? `${paths.src}/${paths.sassGlob}` : `${paths.temp}/${paths.sassGlob}`;

  return gulp.src(srcGlob)
    .pipe(sassCompilerInstance().on('error', sassCompilerInstance.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest(destPath));
});

// Process CSS files (autoprefixing and minifying)
gulp.task('process-css', () => {
  const isWatch = process.env.NODE_ENV === 'watch';
  if (isWatch) return Promise.resolve(); // Skip minification in watch mode

  return gulp.src(`${paths.temp}/${paths.cssGlob}`)
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS())
    .pipe(gulp.dest(`${paths.temp}/${paths.cssDest}`));
});

/*----------------------------------------------------------------------------------------------------*/
/*                                              Prettier                                              */
/*----------------------------------------------------------------------------------------------------*/

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

/*----------------------------------------------------------------------------------------------------*/
/*                                               ESLint                                               */
/*----------------------------------------------------------------------------------------------------*/

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
    done();
  });
});

/*----------------------------------------------------------------------------------------------------*/
/*                                             Stylelint                                              */
/*----------------------------------------------------------------------------------------------------*/

// Run Stylelint with limited auto-fix for watch task
gulp.task('stylelint-watch', () => {
  return gulp.src(`${paths.src}/${paths.cssGlob}`)
    .pipe(stylelint({
      fix: true, // Fixes code style issues, but not errors
      configFile: path.resolve('.stylelint.config.mjs'),
      reporters: [{ formatter: 'string', console: true }],
    }));
});

/*----------------------------------------------------------------------------------------------------*/
/*                                             File Move                                              */
/*----------------------------------------------------------------------------------------------------*/

// Copy all files to temp directory
gulp.task('copy-files-to-temp', () => {
  return gulp.src(paths.srcGlob)
    .pipe(gulp.dest(paths.temp));
});

// Function to move files and rename manifest
function moveFilesToDist(distPath, manifestPath) {
  const globPatterns = [
    `${paths.temp}/**/*`,
    `!${paths.temp}/${paths.chromeManifest}`,
    `!${paths.temp}/${paths.firefoxManifest}`,
    `!${paths.temp}/${paths.uncompressedImages}/**/*`,
    `!${paths.temp}/**/Thumbs.db`
  ];

  return new Promise((resolve, reject) => {
    gulp.src(globPatterns)
      .pipe(gulp.dest(distPath))
      .on('end', () => {
        gulp.src(manifestPath)
          .pipe(rename(paths.defaultManifestName))
          .pipe(gulp.dest(distPath))
          .on('end', resolve)
          .on('error', reject);
      })
      .on('error', reject);
  });
}

// Move files to dist task
gulp.task('move-files-to-dist', async () => {
  try {
    await Promise.all([
      moveFilesToDist(`${paths.dist}/${paths.distChrome}`, `${paths.temp}/${paths.chromeManifest}`),
      moveFilesToDist(`${paths.dist}/${paths.distFirefox}`, `${paths.temp}/${paths.firefoxManifest}`)
    ]);

    // Remove the uncompressed images folders after the move
    await Promise.all([
      rimraf(`${paths.dist}/${paths.distChrome}/images/foil/uncompressed`),
      rimraf(`${paths.dist}/${paths.distFirefox}/images/foil/uncompressed`)
    ]);
  } catch (err) {
    console.error('Error during move-files-to-dist:', err);
    throw err;
  }
});

/*----------------------------------------------------------------------------------------------------*/
/*                                             Folder Zip                                             */
/*----------------------------------------------------------------------------------------------------*/

// Zip the dist folders
gulp.task('zip', () => {
  return Promise.all([
    gulp.src(`${paths.dist}/${paths.distChrome}/**/*`)
      .pipe(zip('chrome-extension.zip'))
      .pipe(gulp.dest(`${paths.dist}`)),
    gulp.src(`${paths.dist}/${paths.distFirefox}/**/*`)
      .pipe(zip('firefox-extension.zip'))
      .pipe(gulp.dest(`${paths.dist}`))
  ]);
});

/*----------------------------------------------------------------------------------------------------*/
/*                                             Main Tasks                                             */
/*----------------------------------------------------------------------------------------------------*/

/*---------- Watch Tasks ----------*/
gulp.task('watch-styles', () => {
  process.env.NODE_ENV = 'watch';
  gulp.watch(`${paths.src}/${paths.sassGlob}`, gulp.series('process-sass', 'stylelint-watch'));
});

gulp.task('watch-code', () => {
  process.env.NODE_ENV = 'watch';
  gulp.watch([`${paths.src}/**/*.js`, `${paths.src}/**/*.html`], gulp.series('prettier-check', 'eslint-watch'));
});

gulp.task('watch', gulp.parallel('watch-styles', 'watch-code'));

/*---------- One Time Tasks ----------*/

// One-time lint and css build/processing task (alternative for watching)
gulp.task('lint-and-convert-once', (done) => {
  process.env.NODE_ENV = 'watch';
  gulp.series(gulp.series('process-sass', 'stylelint-watch'), gulp.series('prettier', 'eslint-watch'))(done);
});

// One-time sass conversion of src folder styles
gulp.task('process-css-once', (done) => {
  process.env.NODE_ENV = 'watch';
  gulp.series(gulp.series('process-sass'))(done);
});

// Build-dist task ( use "gulp build-dist --skip-cleanup" to skip the folder deletions)
gulp.task('build-dist', async () => {
  const skipCleanup = process.argv.includes('--skip-cleanup');

  try {
    await gulp.series(
      'sync-manifest-version',
      'clean',
      'copy-files-to-temp',
      'process-sass',
      'process-css',
      'prettier',
      'eslint',
      'move-files-to-dist',
      'zip',
      'clean-temp'
    )();
  } catch (err) {
    console.error('Error during build:', err.message);
    if (!skipCleanup) {
      await gulp.series('clean')();
    }
    throw err;
  }
});

// Default task for one-time processing
gulp.task('default', gulp.series('lint-and-convert-once'));
