var gulp = require('gulp');
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var notify = require('gulp-notify');
var template = require('gulp-lodash-template');
var concat = require('gulp-concat');
var browserify = require('browserify');
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
	.pipe(uglify())
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
}

exports.bundle = bundle;
exports.styles = styles;
exports.cp = cp;
exports.templates = templates;
