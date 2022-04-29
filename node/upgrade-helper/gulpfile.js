const { series, src, dest } = require('gulp');
const del = require('del');
const _ = require('lodash');
const jsonfile = require('jsonfile');
const path = require('path');
const argv = require('yargs').argv;
let srcPath;
let destPath;
const DELETE_VAL = 'marked_to_remove';
const VERSION_KEY = 'version';

srcPath = argv.src || process.cwd();
destPath = argv.dest;
console.log('srcPath = ' + srcPath);
console.log('destPath = ' + destPath);

async function cleanForUpgrade() {
    if (srcPath && destPath) {
        return del([
            './*',
            './src/*',
            '!./src',
            '!./src/app',
            '!./proxy-config.json',
            './mt-service/*',
            '!./mt-service',
            './mt-service/src/*',
            '!./mt-service/src',
            '!./mt-service/src/config',
        ], { force: true, cwd: destPath });
    } else {
        return console.log("plese set the dest value to continue");

    }
}

async function copyForUpgrade() {
    if (srcPath && destPath) {
        return src(['./**/*', '!./upgrade-helper', '!./upgrade-helper/**/*'], { cwd: srcPath })
            .pipe(dest('./', { cwd: destPath, overwrite: false }));
    }
}

async function cleanForInstall() {
    if (srcPath && destPath) {
        return del([
            './*'
        ], { force: true, cwd: destPath });
    } else {
        console.log("plese set the dest value to continue");
        return;
    }
}

async function copyForInstall() {
    if (srcPath && destPath) {
        return src(['./**/*', '!./upgrade-helper', '!./upgrade-helper/**/*'], { cwd: srcPath })
            .pipe(dest('./', { cwd: destPath }));
    }
}

async function updateProxyConfig() {

    if (srcPath && destPath) {
        const srcFile = jsonfile.readFileSync(path.join(srcPath, '/proxy-config.json'));
        const destFile = jsonfile.readFileSync(path.join(destPath, '/proxy-config.json'));
        _.forEach(srcFile, function (value, key) {
            if (value['value'] != DELETE_VAL && !(_.has(destFile, key))) {
                _.set(destFile, key, value);
                console.log('new key "' + key + '" added');
            } else if (value['value'] == DELETE_VAL && _.has(destFile, key)) {
                _.unset(destFile, key);
                console.log('key "' + key + '" removed');

            }
        });
        jsonfile.writeFileSync(path.join(destPath, '/proxy-config.json'), destFile, { spaces: 2, EOL: '\r\n' });
    }
}

async function updateServiceConfig() {

    if (srcPath && destPath) {
        const srcFile = jsonfile.readFileSync(path.join(srcPath, '/mt-service/src/config/config.json'));
        const destFile = jsonfile.readFileSync(path.join(destPath, '/mt-service/src/config/config.json'));
        _.forEach(srcFile, function (value, key) {
            if (value['value'] != DELETE_VAL && !(_.has(destFile, key))) {
                _.set(destFile, key, value);
                console.log('new key "' + key + '" added');
            } else if (value['value'] == DELETE_VAL && _.has(destFile, key)) {
                _.unset(destFile, key);
                console.log('key "' + key + '" removed');
            }
        });
        jsonfile.writeFileSync(path.join(destPath, '/mt-service/src/config/config.json'), destFile, { spaces: 2, EOL: '\r\n' });
    }
}

async function updateConfig() {
    if (srcPath && destPath) {
        const srcFile = jsonfile.readFileSync(path.join(srcPath, '/src/app/config/config.json'));
        const destFile = jsonfile.readFileSync(path.join(destPath, '/src/app/config/config.json'));
        recurUpdateConfig(srcFile, destFile);
        jsonfile.writeFileSync(path.join(destPath, '/src/app/config/config.json'), destFile, { spaces: 2, EOL: '\r\n' });
    }
}

function recurUpdateConfig(srcVal, destVal) {
    _.forEach(srcVal, function (value, key) {
        //update the version value
        if (key == VERSION_KEY) {
            _.set(destVal, key, value);
        }
        if (value['value'] != DELETE_VAL && !(_.has(destVal, key))) {
            _.set(destVal, key, value);
            console.log('new key "' + key + '" added');
        } else if (value['value'] == DELETE_VAL && _.has(destVal, key)) {
            _.unset(destVal, key);
            console.log('key "' + key + '" removed');
        }
        else if (_.isObject(value['value'])) {
            recurUpdateConfig(value['value'], destVal[key]['value']);
        }
    });
}

async function updateLocale() {
    if (srcPath && destPath) {
        const srcFile = jsonfile.readFileSync(path.join(srcPath, '/src/app/locale/en.json'));
        const destFile = jsonfile.readFileSync(path.join(destPath, '/src/app/locale/en.json'));
        recurUpdateLocale(srcFile, destFile);
        jsonfile.writeFileSync(path.join(destPath, '/src/app/locale/en.json'), destFile, { spaces: 2, EOL: '\r\n' });
    }
}

function recurUpdateLocale(srcVal, destVal) {
    _.forEach(srcVal, function (value, key) {
        if (value != DELETE_VAL && !(_.has(destVal, key))) {
            _.set(destVal, key, value);
            console.log('new key "' + key + '" added');
        } else if (value == DELETE_VAL && _.has(destVal, key)) {
            _.unset(destVal, key);
            console.log('key "' + key + '" removed');
        } else if (_.isObject(value)) {
            recurUpdateLocale(value, destVal[key]);
        }
    });
}

async function updateResources() {
    if (srcPath && destPath) {
        return src(['./src/app/resources/*'], { cwd: srcPath })
            .pipe(dest('./src/app/resources/', { cwd: destPath, overwrite: false }));
    }
}

exports.upgrade = series(cleanForUpgrade, copyForUpgrade, updateProxyConfig, updateServiceConfig, updateConfig, updateLocale, updateResources);
exports.install = series(cleanForInstall, copyForInstall);