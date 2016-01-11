var gulp = require('gulp');
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var copy = require('gulp-copy');
var notify = require('gulp-notify');
var imagemin = require('gulp-imagemin');
var browserify = require('browserify');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');

var basePath = {
	src: 'source/',
	dest: 'dist/',
	test: 'test/app/public/'
};

var srcAssets = {
	scripts: basePath.src + 'scripts/',
	styles: basePath.src + 'styles/',
	images: basePath.src + 'images/',
	partials: basePath.src + 'partials/',
	fonts: basePath.src + 'fonts/'
};

var destAssets = {
	scripts: basePath.dest + 'scripts/',
	styles: basePath.dest + '/',
	images: basePath.dest + 'images/',
	partials: basePath.dest + 'partials/',
	fonts: basePath.dest + 'fonts/'
};


gulp.task('browserify', function() {
	var bundleStream = browserify(srcAssets.scripts+'main.js', {
		standalone: 'Wchat',
		debug: true
	}).bundle();

	bundleStream
	.pipe(source(srcAssets.scripts+'main.js'))
	.pipe(rename('wchat.js'))
	.pipe(gulp.dest(basePath.dest))
	.pipe(gulpif(argv.production, streamify(uglify())))
	.pipe(gulpif(argv.production, rename({suffix: '.min'})))
	.pipe(gulpif(argv.production, gulp.dest(basePath.dest)))
	.pipe(notify({ message: 'browserify task complete' }));
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

gulp.task('partials', function() {
	return gulp.src(srcAssets.partials+'*')
	.pipe(gulp.dest(destAssets.partials));
});

gulp.task('fonts', function() {
	return gulp.src(srcAssets.fonts+'*')
	.pipe(gulp.dest(destAssets.fonts));
});

gulp.task('cp', function() {
	
	gulp.src(basePath.src+'*.html')
	.pipe(gulp.dest(basePath.dest));

	gulp.src(basePath.src+'translations.json')
	.pipe(gulp.dest(basePath.dest));
});

gulp.task('build', function() {
	gulp.start('browserify', 'styles', 'images', 'partials', 'cp', 'fonts');
});

gulp.task('default', function() {
	gulp.start('browserify', 'styles');
});

gulp.task('test', function() {
	return gulp.src(basePath.dest+'**/*')
	.pipe(gulp.dest(basePath.test));
});

// gulp.task('clean', function() {
//     return del(['dist/css', 'dist/js', 'dist/img']);
// });
