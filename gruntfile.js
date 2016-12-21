module.exports = function(grunt) {

  grunt.initConfig({
    uglify: {
      my_target: {
        files: {
        'dest/app.min.js': ['src/bitlyresolver.js']
        }
      }
    },
    copy: {
      statics: {
        files: [{
          expand: true,
          src: ['lib/**', 'icons/icon*'],
          dest: 'dest',
          filter: 'isFile'
        }, {
          expand: true,
          src: ['src/manifest.json'],
          dest: 'dest',
          flatten: true,
          filter: 'isFile'
        }]
      }
    },
    shell: {
      clean: {
        command: () => 'rm -rf dest && mkdir dest'
      },
      pack: {
        command: () => 'zip -r bitlyResolverCE-vXXXXXXX.zip dest'
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['shell:clean', 'uglify', 'copy:statics']);
  grunt.registerTask('pack', ['shell:clean', 'uglify', 'copy:statics', 'shell:pack']);
};
