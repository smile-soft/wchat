var gulp = require('gulp');
var vfs = require('vinyl-fs');
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');
var buffer = require('vinyl-buffer');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var copy = require('gulp-copy');
var notify = require('gulp-notify');
// var imagemin = require('gulp-imagemin');
var template = require('gulp-lodash-template');
var concat = require('gulp-concat');
var browserify = require('browserify');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var del = require('del');
var log = require('gulplog');
var nameSpace = 'Wchat';

var basePath = {
	src: 'source/',
	dest: 'dist/',
	test: 'test/app/public/webchat'
};

var srcAssets = {
	scripts: basePath.src + 'scripts/',
	styles: basePath.src + 'styles/',
	images: basePath.src + 'images/',
	templates: basePath.src + 'templates/',
	sounds: basePath.src + 'sounds/',
	fonts: basePath.src + 'fonts/'
};

var destAssets = {
	scripts: basePath.dest + 'scripts/',
	styles: basePath.dest + '/',
	images: basePath.dest + 'images/',
	templates: basePath.dest + 'templates/',
	sounds: basePath.dest + 'sounds/',
	fonts: basePath.dest + 'fonts/'
};

function bundle(cb) {
	var bundleStream = browserify(srcAssets.scripts+'main.js', {
		standalone: nameSpace,
		debug: true
	}).bundle();

	bundleStream
	.pipe(source('main.js'))
	.pipe(buffer())
	// .pipe(source('wchat.js'))
	// .pipe(gulp.dest(basePath.dest))
	.pipe(uglify())
	// .pipe(rename({
	// 	suffix: '.min'
	// }))
	// .pipe(gulp.dest(basePath.dest))
	// .pipe(vfs.symlink(basePath.dest))
	// .pipe(gulp.src([basePath.dest+'main.js', srcAssets.scripts+'libs/jssip.min.js'], { passthrough: true }))
	.pipe(gulp.src(srcAssets.scripts+'libs/jssip.min.js', { passthrough: true }))
	.pipe(concat('wchat.min.js'))
	.pipe(gulp.dest(basePath.dest))
	.pipe(notify({ message: 'bundle task complete' }));

	cb();
}

function styles(cb) {
	gulp.src(srcAssets.styles+'*.scss')
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(destAssets.styles))
	.pipe(notify({ message: 'styles task complete' }));

	cb();
}

// function images(cb) {
// 	gulp.src(srcAssets.images+'*')
// 	.pipe(imagemin())
// 	.pipe(gulp.dest(destAssets.images));

// 	cb();
// }

function templates(cb) {
	gulp.src(srcAssets.templates+'*.html')
	.pipe(template({
		commonjs: true
	}))
	.pipe(concat('templates.js'))
	.pipe(gulp.dest(srcAssets.scripts))
	.pipe(notify({ message: 'templates task complete' }));

	cb();
}

function sounds(cb) {
	gulp.src(srcAssets.sounds+'*')
	.pipe(gulp.dest(destAssets.sounds));

	cb();
}

function fonts(cb) {
	gulp.src(srcAssets.fonts+'*')
	.pipe(gulp.dest(destAssets.fonts));

	cb();
}

function cp(cb) {

	gulp.src(basePath.src+'translations.json')
	.pipe(gulp.dest(basePath.dest));

	gulp.src(basePath.src+'forms.json')
	.pipe(gulp.dest(basePath.dest));

	gulp.series(sounds, fonts);

	cb();
	// gulp.src(basePath.src+'loader.js')
	// .pipe(gulp.dest(basePath.dest));
}

exports.bundle = bundle;
exports.styles = styles;
exports.cp = cp;
exports.templates = templates;
// exports.images = images;
// exports.build = gulp.series(styles, images, templates, cp, bundle);

// gulp.task('default', function() {
// 	gulp.start('bundle');
// });

// gulp.task('test', function() {
// 	return gulp.src(basePath.dest+'**/*')
// 	.pipe(gulp.dest(basePath.test));
// });

// gulp.task('clean', function() {
//     return del(['dist/css', 'dist/js', 'dist/img']);
// });
