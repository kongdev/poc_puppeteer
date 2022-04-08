import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { format } from '@fast-csv/format'

export const evenandboy = async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--start-fullscreen'],
        })
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })
        const URL = 'https://www.eveandboy.com/product?category=5637146942&sub=5637146955&detail=5637146984'
        await page.goto(URL, { waitUntil: 'networkidle2' })

        // scrolldown
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                const distance = 10
                const delay = 50
                const timer = setInterval(() => {
                    const docs: any = document.scrollingElement
                    docs.scrollBy(0, distance)
                    if (docs.scrollTop + window.innerHeight >= docs.scrollHeight) {
                        clearInterval(timer)
                        resolve()
                    }
                }, delay)
            })
        })

        // get html
        const pageData = await page.evaluate(() => {
            return {
                html: document.documentElement.innerHTML,
            }
        })

        //selector element
        const $ = cheerio.load(pageData.html)
        const containerElement = $('#container-product-filter')
        const productGrid = containerElement.find('.row-product-grid.el-row:last').find('.el-col')

        // write csv
        const csvFile = fs.createWriteStream(path.resolve(__dirname, '../file.csv'))
        const stream = format({ headers: true })
        stream.pipe(csvFile)

        // each item
        productGrid.each((key: number, item: any) => {
            const brand = $(item).find('H6.brand').text()
            const name = $(item).find('a.name').text()
            const priceDiscount = $(item).find('.price.price__full').text()
            const price = $(item).find('.price.price__reg').text()
            const link = $(item).find('a').attr('href')
            const images = $(item).find('.image-card > img').attr('src')
            stream.write({
                brand_name: brand,
                title: name,
                price,
                price_discount: priceDiscount,
                link,
                images,
            })
        })
        // end csv
        stream.end()

        await browser.close()
    } catch (e) {
        console.log(e)
    }
}
