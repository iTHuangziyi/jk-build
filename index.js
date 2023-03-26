#!/usr/bin/env node
const Jenkins = require("jenkins")
const inquirer = require('inquirer')

// 加载缓存包
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    // 如果该目录不存在则自动生成
    localStorage = new LocalStorage('D:\/jk-build\/scratch');
}

// jenkins服务地址
const host = 'localhost:8080'

let jenkins;

let jobListPrompt = [];


// 问题数组
const prompt = [
    {
        type: 'input',
        name: 'account',
        message: '请输入jenkins账号',
        validate(input) {
            if (!input || input.length === 0) {
                return '请输入jenkins账号！'
            }
            return true
        }
    },
    {
        type: 'password',
        name: 'password',
        message: '请输入jenkins密码',
        validate(input) {
            if (!input || input.length === 0) {
                return '请输入jenkins密码！'
            }
            return true
        }
    }
]

function getJobPrompt(list) {
    return [
        {
            // 这里的打包仓库支持多选
            type: 'list',
            name: 'repository',
            message: '请选择需要打包的仓库（空格选择）',
            choices: list?.map(it => it.name) ?? [],
            validate(input) {
                if (!input || input.length === 0) {
                    return '请选择至少一个仓库！'
                }
                return true
            }
        },
        // 如果job构建任务配置了参数
        {
            type: 'input',
            name: 'branchs',
            message: '请输入需要构建参数Demo-params',
            validate(input) {
                if (!input || input.length === 0) {
                    return '请输入需要构建参数Demo-params！'
                }
                return true
            },
        }
    ]
}

// 初始化jenkins实例
async function initJenkins({ account, password } = {}) {
    try {
        // 拼接baseUrl
        const baseUrl = `http://${account}:${password}@${host}`;
        // 创建Jenkins实例
        jenkins = new Jenkins({ baseUrl, crumbIssuer: true })
        // 通过获取jenkins信息验证登录结果
        await jenkins.info() 
        // 获取jenkins服务的job任务列表
        const res = await jenkins.job.list()
        // 动态生成prompt
        jobListPrompt = getJobPrompt(res)
        return true
    } catch (error) {
        console.log('获取jenkins服务信息出错了！')
        return false
    }
}

async function hdBuild({ repository, params }) {
    await jenkins.job.build(repository,
        // 这里传入job构建时需要的参数信息
        {
            parameters: {
                // 替换成自己job任务的配置参数
                'Demo-params': params,
            }
        });
    console.log('打包任务已经开始了！')
}

function setLocalStorage({ account, password }){
    localStorage.setItem('account',account)
    localStorage.setItem('password',password)
}

function removeLocalStorage(){
    localStorage.removeItem('account')
    localStorage.removeItem('password')
}


async function main() {
    // 读取缓存信息
    const account = localStorage.getItem('account')
    const password = localStorage.getItem('password')
    let answers = {}
    if(account && password){
        // 使用缓存的账号密码
        answers = {
            account,
            password
        }
    }else{
        // 引导用户输入密码
        answers = await inquirer.prompt(prompt)
    }
    // 初始化jenkins
    const isLogin = await initJenkins(answers)
    // 登录状态
    if(isLogin){
        // 缓存登录信息
        setLocalStorage(answers)
        // 引导用户输入打包仓库和构建参数
        const buildInfo = await inquirer.prompt(jobListPrompt)
        // 执行打包任务
        hdBuild(buildInfo)
    }else{
        // 删除缓存信息
        removeLocalStorage()
    }
}

main()