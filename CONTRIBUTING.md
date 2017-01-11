## Reporting issue
* Do describe the steps to reproduce.
* Do describe the expected and actual behaviour.
* It will always help if you can provider a sample project that demonstrates the problem.

## Release process
To perform the release you must have write access to this project and be added 
as collaborator in [NPM for gulp-bless](https://www.npmjs.com/package/gulp-bless).

1. Pull `master` branch and ensure you have latest changes.
1. Run `npm test` to make sure all the tests are passing.
    * If there are test failures fix them, commit, push, and start from step 1.
1. Increase the version in package.json. See [semver.org](http://semver.org/) to figure out which part of the version string to increase.
1. Login to NPM by using the command `npm login`, you can use `npm whoami` to check your login status.
1. Run `npm publish`
1. Commit and push the your changes in `package.json`
1. Go to the GitHub project and create a release (see the releases tab). 
    * Use the release version as title, e.g. "3.2.1". 
    * Make sure the branch is master, add a quick description of the changes in the release (for example: "Fix for blah blah <link to issue>").
    * Pre-release checkbox shouldn't be checked.
