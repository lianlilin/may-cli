#! /usr/bin/env node
/**
 * @file 入口文件
 * @author lianlilin@foxmail.com
 */

const inquirer = require('inquirer');
const pacote = require('pacote');
const packageName = 'may-templates-demoqq';
const program = require('commander');
const version = require('../../package').version;
const ncp = require('ncp');
const cacheDir = 'mayCache';
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora();
let userQuestions = [
    {
        type: 'input',
        name: 'projectName',
        message: 'Project name',
        default() {
            return 'may-demo';
        }
    },
    {
        type: 'input',
        name: 'projectDescription',
        message: 'Project description',
        default() {
            return 'A vue project';
        }
    },
    {
        type: 'input',
        name: 'projectAuthor',
        message: 'Author',
        default() {
            return 'Your Name <you@example.com>';
        }
    }
];


program
    .version(version, '-v, --version')
    .description('CLI for rapid EOP swan development')
    .usage('<command> [options]');

// 初始化命令s
program
.command('init')
.action(() => {
    inquirer.prompt(userQuestions)
    .then(answers => {
        spinner.start('Start download template');
        return pacote.extract(packageName, './mayCache', {
            cache: false
        }).then(() => {
            spinner.succeed('Download template succeed');
            return answers;
        });
    })
    .then(answers => {
        return new Promise((resolve, reject) => {
            spinner.start('Start copy template');
            ncp(cacheDir, answers.projectName, err => {
                if (err) {
                    spinner.fail('Copy copy failed');
                    reject(err);
                } else {
                    shell.rm('-rf', cacheDir);
                    spinner.succeed('Copy template succeed');
                    resolve(answers);
                }
            });
        });
    })
    .then(answers => {
        // 修改package.json
        let packagejsonPath = path.resolve(process.cwd(), `./${answers.projectName}/package.json`);
        const packageJson = Object.assign(
            require(packagejsonPath),
            {
                name: answers.projectName,
                author: answers.projectAuthor,
                version: '0.0.1'
            }
        );
        fs.writeFileSync(packagejsonPath, JSON.stringify(packageJson, null, 4));
        // 重命名文件
        fs.renameSync(
            `${answers.projectName}/.npmrc.text`,
            `${answers.projectName}/.npmrc`
        );
        fs.renameSync(
            `${answers.projectName}/.gitignore.text`,
            `${answers.projectName}/.gitignore`
        );
        // 替换变量
        let readmePath = `./${answers.projectName}/README.md`;
        let data = fs.readFileSync(readmePath)
        .toString()
        .replace('PROJECT_DESCRIPTION', answers.projectDescription);
        fs.writeFileSync(readmePath, data);
        return answers;
    })
    .then(answers => {
        console.log(chalk.green('\nCreated an project'));
        console.log(
            `\n you can: ${chalk.green(
                `cd ${answers.projectName}`
            )} && ${chalk.green(
                'npm i \n'
            )}`
        );
    })
    .catch(err => {
        console.warn(chalk.red('\n [error]'));
        spinner.fail(chalk.red(err.toString()));
        console.log(err);
    });
});
program.parse(process.argv);