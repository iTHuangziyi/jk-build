#!/usr/bin/env node
const Jenkins = require('jenkins')

const host = '120.48.84.169:8080'

const username = 'admin'

const password = 'admin'

const baseUrl = `http://${username}:${password}@${host}`



try {
    const jenkins = new Jenkins({
        baseUrl,
        crumbIssuer: true
    })
    jenkins.info().then(res=>{
        console.log(res)
    })
} catch (error) {
    console.log(33333)
}

