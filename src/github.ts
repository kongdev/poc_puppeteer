import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'


export const run = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ['--disable-extensions'],
        executablePath: '/usr/bin/google-chrome-stable',
        args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
      
    })
    const page = await browser.newPage()
        await page.setDefaultNavigationTimeout(0)
        await page.goto('https://github.com', { waitUntil: 'load', timeout: 0 })
        const pageData = await page.evaluate(() => {
            return {
                html: document.documentElement.innerHTML,
            }
        })
        const $ = cheerio.load(pageData.html)
        const body = $('body')
        console.log(body)
        
        browser.close()
}