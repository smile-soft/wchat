var gulp = require('gulp');
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var copy = require('gulp-copy');
var notify = require('gulp-notify');
var imagemin = require('gulp-imagemin');
var template = require('gulp-lodash-template');
var concat = require('gulp-concat');
var browserify = require('browserify');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
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


gulp.task('bundle', function() {
	var bundleStream = browserify(srcAssets.scripts+'main.js', {
		standalone: nameSpace,
		debug: true
	}).bundle();

	bundleStream
	.pipe(source(srcAssets.scripts+'main.js'))
	.pipe(rename('wchat.js'))
	.pipe(gulp.dest(basePath.dest))
	.pipe(streamify(uglify()))
	.pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest(basePath.dest))
	.pipe(notify({ message: 'bundle task complete' }));
});

gulp.task('styles', function() {
	return gulp.src(srcAssets.styles+'*.scss')
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(destAssets.styles))
	.pipe(notify({ message: 'styles task complete' }));
});

gulp.task('images', function() {
	return gulp.src(srcAssets.images+'*')
	.pipe(imagemin())
	.pipe(gulp.dest(destAssets.images));
});

gulp.task('templates', function() {
	return gulp.src(srcAssets.templates+'*.html')
	.pipe(template({
		commonjs: true
	}))
	.pipe(concat('templates.js'))
	.pipe(gulp.dest(srcAssets.scripts))
	.pipe(notify({ message: 'templates task complete' }));
});

gulp.task('sounds', function() {
	return gulp.src(srcAssets.sounds+'*')
	.pipe(gulp.dest(destAssets.sounds));
});

gulp.task('fonts', function() {
	return gulp.src(srcAssets.fonts+'*')
	.pipe(gulp.dest(destAssets.fonts));
});

gulp.task('cp', function() {

	gulp.src(basePath.src+'translations.json')
	.pipe(gulp.dest(basePath.dest));

	gulp.src(basePath.src+'forms.json')
	.pipe(gulp.dest(basePath.dest));

	gulp.start('sounds', 'fonts');
});

gulp.task('build', function() {
	gulp.start('styles', 'images', 'templates', 'cp', 'fonts', 'bundle');
});

gulp.task('default', function() {
	gulp.start('bundle');
});

gulp.task('test', function() {
	return gulp.src(basePath.dest+'**/*')
	.pipe(gulp.dest(basePath.test));
});

// gulp.task('clean', function() {
//     return del(['dist/css', 'dist/js', 'dist/img']);
// });
