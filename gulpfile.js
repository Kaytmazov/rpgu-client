'use strict';

const { src, dest, series, parallel, watch } = require('gulp');
const plumber = require('gulp-plumber');
const fileinclude = require('gulp-file-include');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const run = require('run-sequence');
const del = require('del');

const folder = {
  src: 'src/',
  dist: 'dist/',
  nodeModules: 'node_modules/'
};

// Очищаем папку build перед сборкой
function clean() {
  return del(folder.dist);
}

// Копируем в папку build
function copy() {
  return src([
    folder.src + 'fonts/**/*.{woff,woff2}',
    folder.src + '*.html',
    folder.src + 'libs/**'
  ], {
    base: folder.src
  })
  .pipe(dest(folder.dist));
}

// Copy Assets
function copyAssets() {
  return src([
    folder.nodeModules + 'bootstrap/dist/js/bootstrap.bundle.min.js'
  ])
  .pipe(dest(folder.dist + 'libs'));
}

// Server
function serve() {
  browserSync.init({
    server: folder.dist,
    browser: 'google chrome'
  });
  watch(folder.src + '*.html', html);
  watch(folder.src + 'scss/**/*.scss', css);
  watch(folder.src + 'js/**/*.js', js);
}

// BrowserSync Reload
function browserSyncReload(done) {
  browserSync.reload();
  done();
}

// Копируем html в build
function html() {
   return src(folder.src + '*.html')
   .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
      indent: true
    }))
    .pipe(dest(folder.dist))
    .pipe(browserSync.stream());
}

// CSS
function css() {
  return src(folder.src + 'scss/style.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(postcss([
      autoprefixer({browsers: [
        'last 3 versions'
      ]})
    ]))
    .pipe(dest(folder.dist + 'css'))
    .pipe(postcss([
      cssnano()
    ]))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(folder.dist + 'css'))
    .pipe(browserSync.stream());
}

// JS
function js() {
  return src(folder.src + 'js/**/*.js')
    .pipe(dest(folder.dist + 'js'))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(dest(folder.dist + 'js'))
    .pipe(browserSync.stream());
}

// Images
function images() {
  return src(folder.src + 'img/**/*.{png,jpg,gif}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(dest(folder.dist + 'img'));
}

// SVG sprite
function svgSprite() {
  return src(folder.src + 'img/svg-sprite/*.svg')
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(dest(folder.dist + 'img'));
}


// SVG min
function svgMin() {
  return src(folder.src + 'img/svg-icons/*.svg')
    .pipe(svgmin())
    .pipe(dest(folder.dist + 'img/icons'));
}

const build = series(clean, copy, parallel(css, js, copyAssets, images, svgSprite, svgMin));

exports.images = images;
exports.svgSprite = svgSprite;
exports.svgMin = svgMin;
exports.copy = copy;
exports.build = build;
exports.default = series(build, serve);
