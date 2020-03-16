#! /usr/bin/env node
/**
 * @file 入口文件
 * @author lianlilin@foxmail.com
 */

const inquirer = require('inquirer');
const pacote = require('pacote');
const packageName = 'may-templates-demo';
const program = require('commander');
const version = require('../../package').version;
const ncp = require('ncp');
const cacheDir = 'mayCache';
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
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
        return pacote.extract(packageName, './mayCache', {
            cache: false
        }).then(() => {
            return answers;
        });
    })
    .then(answers => {
        return new Promise((resolve, reject) => {
            ncp(cacheDir, answers.projectName, err => {
                if (err) {
                    reject(err);
                } else {
                    shell.rm('-rf', cacheDir);
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
    });
});
program.parse(process.argv);