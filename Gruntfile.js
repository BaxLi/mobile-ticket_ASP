const imageminSvgo = require('imagemin-svgo');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminOptipng = require('imagemin-optipng');

module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    build: grunt.file.readJSON('build.config.json'),
    pkg: grunt.file.readJSON('package.json'),
    browsers: ['Chrome', 'Chrome_without_security'],
    customLaunchers: {
      Chrome_without_security: {
        base: 'Chrome',
        flags: ['--disable-web-security']
      }
    },
    shell: {
      options: {
        stderr: false,
        execOptions: {
          maxBuffer: 1000 * 1000 * 100
        }
      },
      ngbuild_development: {
        command: 'ng build'
      },
      ngbuild_production: {
        command: 'ng build --prod'
      },
      mt_build: {
        command: [
          'cd node',
          'npm run build'
        ].join('&&')
      },
      mt_clean: {
        command: [
          'cd node',
          'npm run clean'
        ].join('&&')
      }
    },
    copy: {
      common: {
        files: [
          { expand: true, src: ['dist/*'], dest: 'dist/src', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/app/resources/*'], dest: 'dist/src/app/resources', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/app/config/config.json'], dest: 'dist/src/app/config', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/app/locale/en.json'], dest: 'dist/src/app/locale', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/app/locale/cookie-consent-files/*'], dest: 'dist/src/app/locale/cookie-consent-files', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/app/theme/*'], dest: 'dist/src/app/theme', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/libs/css/*'], dest: 'dist/src/libs/css/', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/libs/js/*'], dest: 'dist/src/libs/js/', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/libs/js/intlTelInput.min.js'], dest: 'dist/src/', filter: 'isFile', flatten: true },
          { expand: true, src: ['src/libs/img/*'], dest: 'dist/src/img/', filter: 'isFile', flatten: true },
          { expand: true, src: ['doc/*'], dest: 'dist/doc/', filter: 'isFile', flatten: true },
        ]
      },
      mt_service: {
        files: [
          { expand: true, cwd: 'node/mt-service', src: ['**/*.js','**/*.json'], dest: 'dist/mt-service' }
        ]
      },
      prod: {
        files: [
          // { expand: true, src: ['src/index.html', 'src/favicon.ico', 'src/styles.css'], dest: 'dist/src/', filter: 'isFile', flatten: true },
          // { expand: true, src: ['node_modules/core-js/client/shim.min.js', 'node_modules/zone.js/dist/zone.js',    'node_modules/fingerprintjs2/fingerprint2.js'], dest: 'dist/src/', filter: 'isFile', flatten: true},
          { expand: true, src: ['release-notes/**'], dest: 'dist/'}
        ]
      },
      proxy_files: {
        files: [
          { expand: true, cwd: 'node', src: '**,!mtservice', dest: 'dist/' },
          { expand: true, cwd: 'node', src: ['upgrade-helper/*','bin/**','sslcert/**'], filter: 'isFile', dest: 'dist/' },
          { expand: true, src: ['node/*','!node/server.ts','!node/tsconfig.json'], dest: 'dist/', filter: 'isFile', flatten: true }
        ]
      }
    },
    uglify: {
      options: {
        compress: {
          global_defs: {
            'DEBUG': false
          },
          dead_code: true
        }
      },
      // pre: {
      //   files: {
      //     'dist/src/libs/js/mt.bundle.min.js': ['dist/src/libs/js/mobileticket-*.js'],
      //     'dist/src/libs/js/analytics.bundle.min.js': ['dist/src/libs/js/analytics.min.js'],
      //     // 'dist/src/libs/js/intlTelInput.bundle.min.js': ['dist/src/libs/js/intlTelInput.min.js'],
      //     // 'dist/src/bundle.min.js': ['dist/src/bundle.js']
      //   }
      // },
      // post: {
      //   files: {
      //     'dist/src/bundle.min.js': ['dist/src/bundle.js']
      //   }
      // },
      mt_service: {
        files: [{
          expand: true,
          cwd: 'dist/mt-service/',
          src: ['*.js', '**/*.js'],
          dest: 'dist/mt-service/',
        }],
      },
    },
    cssmin: {
      options: {
        mergeIntoShorthands: false,
        roundingPrecision: -1
      },
      min_all_file: {
        files: [{
          expand: true,
          cwd: 'dist/src/',
          src: ['bundle.css'],
          dest: 'dist/src',
          ext: '.min.css'
        }]
      }
    },
    concat: {
      js: {
        src: ['node_modules/reflect-metadata/Reflect.js', 'node_modules/systemjs/dist/system.src.js', 'dist/src/libs/js/analytics.bundle.min.js', 'dist/src/libs/js/mobileticket-*.js', 
        'dist/src/libs/js/utils.js', 'dist/src/main.*.js', 'dist/src/polyfills-*.js', 'dist/src/runtime.*.js'],
        dest: 'dist/src/bundle.js'
      },
      css: {
        src: ['dist/src/libs/css/*.css', 'dist/src/*.css'],
        dest: 'dist/src/bundle.css'
      }
    },
    clean: {
      options: { force: true },
      start: ["dist/"],
      folders: ['dist/app', 'dist/assets', 'dist/libs'],
      folder_v2: ['dist/src/libs'],
      contents: ["dist/src/bundle.css", "dist/src/bundle.js", "dist/src/styles.css", "dist/src/3rdpartylicenses.txt", "dist/3rdpartylicenses.txt", "dist/src/bundle.min.css", "dist/src/bundle.min.js", 
        "dist/src/main.*.js","dist/src/styles.*.css","dist/src/runtime.*.js",'dist/src/polyfills.*.js', 'dist/src/polyfills-es5.*.js'],
      end: ['dist/*.js', 'dist/*.css', 'dist/*.gz', 'dist/*.map', 'dist/*.html', 'dist/*.ico'],
      git_hub_files: ['<%= build.githubFolder %>/*.*', '!<%= build.githubFolder %>/.git', '!<%= build.githubFolder %>/.gitignore'],
      other_lang_files: ['<%= build.githubFolder %>/src/app/locale/*.json', '!<%= build.githubFolder %>/src/app/locale/en.json'],
      zip_file: ['dist/mobile-ticket.zip']
    },
    'string-replace': {
      inline: {
        files: {
          'dist/src/index.html': 'dist/src/index.html',
        },
        options: {
          replacements: [
            {
              pattern: /<link rel="stylesheet" href="libs\/css\/bootstrap\.min\.css">/g,
              replacement: ''
            },
            {
              pattern: /<link rel="stylesheet" href="libs\/css\/intlTelInput\.css">/g,
              replacement: ''
            },
            {
              pattern: /<script async="" type="text\/javascript" src="libs\/js\/analytics\.min\.js"><\/script>/g,
              replacement: ''
            },
            {
              pattern: /<script type="text\/javascript" src="libs\/js\/intlTelInput\.min\.js"><\/script>/g,
              replacement: '<script type="text/javascript" src="intlTelInput.min.js"></script>'
            },
            {
              pattern: /<script type="text\/javascript" src="libs\/js\/utils\.js"><\/script>/g,
              replacement: ''
            },
            {
              pattern: /<link rel="stylesheet" href="styles\..*\.css">/g,
              replacement: ''
            },
            {
              pattern: /<script src="runtime\..*\.js" .*><\/script>/g,
              replacement: ''
            },
            {
              pattern: /<script src="polyfills-es5\..*\.js" .*><\/script>/g,
              replacement: ''
            },
            {
              pattern: /<script type="text\/javascript" src="libs\/js\/mobileticket-1\.0\.1\.js"><\/script>/g,
              replacement: ''
            },
            {
              pattern: /<!-- AOT-TREESHAKE-BUNDLE-JS -->/g,
              replacement: '<script type=\'text/javascript\' src=\'zip/bundle.min.js\' ></script>'
            },
            {
              pattern: /<!-- AOT-TREESHAKE-BUNDLE-CSS -->/g,
              replacement: '<link href=\'zip/bundle.min.css\' rel=\'stylesheet\'>'
            },

           
            // {
            //   pattern: /<!-- PROD-SHIM-MIN-JS -->/g,
            //   replacement: '<script type=\'text/javascript\' src=\'shim.min.js\'></script>'
            // },
            // {
            //   pattern: /<!-- PROD-ZONE-JS -->/g,
            //   replacement: '<script type=\'text/javascript\' src=\'zone.js\'></script>' 
            // }
          ]
        }
      }
    },
    compress: {
      main: {
        options: {
          mode: 'gzip'
        },
        files: [
          { expand: true, cwd: 'dist/src/', src: ['bundle.js'], dest: 'dist/src/zip', ext: '.min.js.gz' },
          { expand: true, cwd: 'dist/src/', src: ['bundle.css'], dest: 'dist/src/zip', ext: '.min.css.gz' }
        ]
      },
      utt_ms_teams: {
        options: {
          archive: 'dist/utt/MSTeams_MeetingCreator.utt',
          mode: 'zip'
        },
        files: [
          { expand: true, cwd: 'utt/MSTeams_MeetingCreator/', src: ['**'] },
        ]
      }
    },
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /<script type="text\/javascript"(.*?)src="libs\/js\/mobileticket-1.0.1.js"><\/script>/g,
              replacement: function () {
                return '';
              }
            },
            {
              match: /<!-- MOBILE-TICKET-MIN-JS -->/g, replacement: function () {
                return '<script type=\'text/javascript\' src=\'libs/js/mobileticket-1.0.1.min.js\' ></script>';
              }
            },
            {
              match: /xhr.setRequestHeader/g, replacement: function () {
                return '//xhr.setRequestHeader';
              }
            }
          ]
        },
        files: [
          { expand: true, flatten: true, src: ['dist/src/index.html'], dest: 'dist/src' },
          { expand: true, flatten: true, src: ['dist/src/libs/js/mobileticket-1.0.1.js'], dest: 'dist/src/libs/js/' }
        ]
      }
    },
    zip: {
      'using-cwd': {
        cwd: 'dist/',
        //src: ['dist/node_modules/**','dist/src/**','dist/sslcert/**','dist/proxy-config.json','dist/server.js'],
        src: ['dist/**','!dist/node_modules/**'],
        dest: 'dist/mobile-ticket-<%= pkg.version %>.zip'
      }
    },
    secret: grunt.file.readJSON('secret.json'),
    sftp: {
      deploy: {
        files: {
          "./": "dist/mobile-ticket.zip"
        },
        options: {
          path: '<%= secret.path %>',
          host: '<%= secret.host %>',
          username: '<%= secret.username %>',
          password: '<%= secret.password %>',
          showProgress: true,
          srcBasePath: "dist/"
        }
      }
    },
    imagemin: {
      svg: {
        options: {
          optimizationLevel: 7,
          user: [
            imageminSvgo({
              plugins: [{ removeViewBox: true }]
            }),
          ]
        },
        files: [
          {
            expand: true,
            src: ['dist/src/app/resources/*.svg'],
            dest: '.',
            ext: '.svg'
          }
        ]
      },
      png: {
        options: {
          optimizationLevel: 7,
          user: [
            imageminOptipng()
          ]
        },
        files: [
          {
            expand: true,
            src: ['dist/src/app/resources/*.png'],
            dest: '.',
            ext: '.png'
          }
        ]
      },
      jpg: {
        options: {
          progressive: true,
          optimizationLevel: 7,
          user: [
            imageminJpegtran()
          ]
        },
        files: [
          {
            expand: true,
            src: ['dist/src/app/resources/*.jpg'],
            dest: '.',
            ext: '.jpg'
          }
        ]
      }
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'dist/src/index.html': 'dist/src/index.html'
        }
      }
    }
  });

  grunt.registerTask('updateVersion', function () {
    var configPath = "src/app/config/config.json";
    var packagePath = "package.json";
    var serverPackagePath = "node/package.json";

    var config = grunt.file.readJSON(configPath);
    var package = grunt.file.readJSON(packagePath);
    var serverPackage = grunt.file.readJSON(serverPackagePath);
    config.version.value = package.version;
    serverPackage.version = package.version;

    grunt.file.write(configPath, JSON.stringify(config, null, 2));
    grunt.file.write(serverPackagePath, JSON.stringify(serverPackage, null, 2));
});

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-properties-reader');
  grunt.loadNpmTasks('grunt-zip');
  grunt.loadNpmTasks('grunt-ssh');

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');

  grunt.registerTask('help', function () {
    console.log("Available commands \n");
    console.log("Command - grunt \n");
    console.log("Following flags are supported\n");
    console.log("\t build_production - Build project files and copy them to 'dist' folder \n");
    console.log("\t build_development - Build project files and copy them to 'dist' folder without minification \n");
    console.log("\t remote_deploy - Build production release and deploy the zip file to specified location/server. \n");
  });

  grunt.registerTask('build_development', ['clean:start', 'shell:ngbuild_development:command', 'copy:common','copy:mt_service', 'clean:end', 'clean:folder', 'copy:proxy_files']);
  grunt.registerTask('build_production', ['clean:start', 'updateVersion', 'shell:ngbuild_production:command', 'shell:mt_build:command', 'copy:common', 'copy:prod' ,'copy:mt_service', 'uglify:mt_service','cssmin', 'concat', 'string-replace','imagemin', 'compress', 'htmlmin', 'clean:end','clean:contents', 'clean:folders', 'clean:folder_v2', 'copy:proxy_files', 'shell:mt_clean:command', 'zip']);
  // grunt.registerTask('build_production', ['clean:start', 'updateVersion', 'copy:aot_script', 'shell:ngbuild_production:command', 'shell:mt_build:command', 'copy:common', 'copy:prod', 'copy:mt_service', 'uglify:pre', 'concat', 'string-replace', 'uglify:post','uglify:mt_service','cssmin', 'imagemin', 'compress', 'htmlmin', 'clean:end', 'clean:folders', 'clean:folder_v2','clean:contents', 'copy:proxy_files', 'shell:mt_clean:command', 'zip']);
  grunt.registerTask('remote_deploy', ['clean:start', 'copy:aot_script', 'shell:ngbuild_production:command', 'copy:common', 'copy:prod', 'uglify:pre', 'concat', 'string-replace', 'uglify:post', 'cssmin', 'imagemin', 'compress', 'htmlmin', 'clean:end', 'clean:folder', 'clean:folder_v2','clean:contents', 'copy:proxy_files', 'zip', 'sftp:deploy']);
  // grunt.registerTask('test', ['string-replace']);
};