/**
 pm2 deploy <configuration_file> <environment> <command>
 
 Commands:
 setup                run remote setup commands
 update               update deploy to the latest release
 revert [n]           revert to [n]th last deployment or 1
 curr[ent]            output current release commit
 prev[ious]           output previous release commit
 exec|run <cmd>       execute the given <cmd>
 list                 list previous deploy commits
 [ref]                deploy to [ref], the "ref" setting, or latest tag
 @example pm2 [start|restart|stop|delete] ecosystem.config.js
 @example pm2 start ecosystem.config.js --only TG_SETU_BOT
 @example pm2 deploy ecosystem.config.js staging
 @example pm2 deploy ecosystem.config.js production setup && pm2 deploy ecosystem.config.js production
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
 * @see https://pm2.keymetrics.io/docs/usage/deployment/
 */
module.exports = {
  apps: [{
    name: "TG_SETU_BOT",
    script: 'App.js',
    watch: true,
    ignore_watch: [
      '.idea', '.vscode',
      '.vs', 'logs',
      'tmp', 'examples',
      '*.log', 'npm-debug.log*',
      'yarn-debug.log*', 'yarn-error.log*',
      'pids', '*.pid',
      '*.seed', '*.pid.lock',
      'lib-cov', 'coverage',
      '.nyc_output', '.grunt',
      'bower_components', '.lock-wscript',
      'build', 'node_modules',
      'jspm_packages', 'typings',
      '.npm', '.eslintcache',
      '.node_repl_history', '*.tgz',
      '.yarn-integrity', '.env',
      '.next'
    ],
    instance: 1,
    env: {
      "NODE_ENV": "development",
    },
    env_production: {
      "NODE_ENV": "production"
    }
  }],
  
  deploy: {
    "production": {
      "user": "root",
      // Multi host is possible, just by passing IPs/hostname as an array
      "host": ["github.com"],
      // Branch
      "ref": "origin/master",
      // Git repository to clone
      "repo": "https://github.com/IITII/tg_setu_bot",
      // Path of the application on target servers
      "path": "/opt/dev/",
      // Can be used to give options in the format used in the configuration
      // file.  This is useful for specifying options for which there
      // is no separate command-line flag, see 'man ssh'
      // can be either a single string or an array of strings
      "ssh_options": "StrictHostKeyChecking=no",
      // To prepare the host by installing required software (eg: git)
      // even before the setup process starts
      // can be multiple commands separated by the character ";"
      // or path to a script on your local machine
      "pre-setup": "apt-get install -y git",
      // Commands / path to a script on the host machine
      // This will be executed on the host after cloning the repository
      // eg: placing configurations in the shared dir etc
      "post-setup": "ls -la",
      // Commands to execute locally (on the same machine you deploy things)
      // Can be multiple commands separated by the character ";"
      "pre-deploy-local": "echo 'This is a local executed command'",
      // Commands to be executed on the server after the repo has been cloned
      "post-deploy": "npm install && pm2 startOrRestart ecosystem.json --env production",
      // Environment variables that must be injected in all applications on this env
      "env": {
        "NODE_ENV": "production"
      }
    },
    "staging": {
      "user": "root",
      "host": "192.168.12.112",
      "ref": "origin/master",
      "repo": "https://github.com/IITII/tg_setu_bot",
      "path": "/dev/opt/",
      "ssh_options": ["StrictHostKeyChecking=no", "PasswordAuthentication=no"],
      "post-deploy": "pm2 startOrRestart ecosystem.json --env dev",
      "env": {
        "NODE_ENV": "staging"
      }
    }
  }
};
