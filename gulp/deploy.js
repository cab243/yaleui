'use strict';

import plugins  from 'gulp-load-plugins';
import gulp     from 'gulp';

var prompt = require('gulp-prompt').prompt;
var replace = require('gulp-replace');
var inquirer = require('inquirer');
var exec = require('child_process').execSync;

var VERSIONED_FILES = [
  'bower.json',
  'package.json',
  'src/data/yaleui.json',
];

var CURRENT_VERSION = require('../package.json').version;
var NEXT_VERSION;

gulp.task('deploy',
  gulp.series(deploy_prompt, deploy_version, 'build', deploy_commit, deploy_cdn));


function deploy_prompt(done){
  var questions =
  [
    {
        type: 'input',
        name: 'version',
        message: 'What version are we moving to? (Current version is ' + CURRENT_VERSION + ')',
        default: CURRENT_VERSION
    }
  ];

  inquirer.prompt(questions).then(function(answers) {
    NEXT_VERSION = answers.version;
    done();
  });
};


// Bumps the version number in any file that has one
function deploy_version(){
  return gulp.src(VERSIONED_FILES, { base: process.cwd() })
    .pipe(replace(CURRENT_VERSION, NEXT_VERSION))
    .pipe(gulp.dest('.'));
}

// Writes a commit with the changes to the version numbers
function deploy_commit(done){
  exec('git commit -am "Bump to version "' + NEXT_VERSION);
  exec('git tag v' + NEXT_VERSION);
  exec('git push origin master');
  exec('git push --tags');
  exec('git subtree push --prefix dist origin gh-pages');
  done();
}

// Publishes to AWS S3 bucket
function deploy_cdn(done){
  exec('aws s3 sync dist/assets/css s3://yaleui.yale.edu/' + NEXT_VERSION + '/css/');
  exec('aws s3 sync dist/assets/js s3://yaleui.yale.edu/' + NEXT_VERSION + '/js/');
  exec('aws s3 sync dist/assets/img s3://yaleui.yale.edu/' + NEXT_VERSION + '/img/');
  exec('aws s3 sync dist/assets/fonts s3://yaleui.yale.edu/' + NEXT_VERSION + '/fonts/');
done();
}