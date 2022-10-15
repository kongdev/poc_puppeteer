import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { format } from '@fast-csv/format'
import { scrollPageToBottom } from 'puppeteer-autoscroll-down'

export const run = async () => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            // args: ['--start-fullscreen'],
        })
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })

        const urls = [
            {
                breadcrumb: 'makeup_body',
                link: 'https://www.eveandboy.com/product?category=5637146942&sub=5637146943',
            },
            // {
            //     breadcrumb: 'makeup_face',
            //     link: 'https://www.eveandboy.com/product?category=5637146942&sub=5637146955',
            // },
            // {
            //     breadcrumb: 'makeup_lips',
            //     link: 'https://www.eveandboy.com/product?category=5637146942&sub=5637146989',
            // },
            // {
            //     breadcrumb: 'makeup_palettes',
            //     link: 'https://www.eveandboy.com/product?category=5637146942&sub=5637147002',
            // },
            // {
            //     breadcrumb: 'makeup_eye',
            //     link: 'https://www.eveandboy.com/product?category=5637146942&sub=5637146947',
            // },

            // {
            //     breadcrumb: 'skincare_cleanser-exfoliator',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637147114',
            // },
            // {
            //     breadcrumb: 'skincare_eye-care',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637147125',
            // },
            // {
            //     breadcrumb: 'skincare_lips-treatment',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637147132',
            // },
            // {
            //     breadcrumb: 'skincare_mask-blackhead',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637147136',
            // },
            // {
            //     breadcrumb: 'skincare_moisturizers',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637147143',
            // },
            // {
            //     breadcrumb: 'skincare_suncare',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637147152',
            // },
            // {
            //     breadcrumb: 'skincare_treatments',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637147155',
            // },
            // {
            //     breadcrumb: 'skincare_makeup-remove',
            //     link: 'https://www.eveandboy.com/product?category=5637147103&sub=5637160349',
            // },
            // {
            //     breadcrumb: 'fragrance_home',
            //     link: 'https://www.eveandboy.com/product?category=5637146890&sub=5637146896',
            // },
            // {
            //     breadcrumb: 'fragrance_men',
            //     link: 'https://www.eveandboy.com/product?category=5637146890&sub=5637146899',
            // },
            // {
            //     breadcrumb: 'fragrance_women',
            //     link: 'https://www.eveandboy.com/product?category=5637146890&sub=5637146906',
            // },
            // {
            //     breadcrumb: 'fragrance_unisex',
            //     link: 'https://www.eveandboy.com/product?category=5637146890&sub=5637160328',
            // },
        ]

        for (let i = 0; i < urls.length; i++) {
            const item = urls[i]
            await page.goto(`${item.link}`, { waitUntil: 'networkidle2' })
            await Promise.all([
                page.waitForSelector('.app-content-main:not(:empty)'),
                page.waitForSelector('.loading-screen.active', { hidden: true }),
            ])

            // scroll down
            let isLoadingAvailable = true
            while (isLoadingAvailable) {
                await scrollPageToBottom(page, { size: 20, delay: 40 })
                const scrollStop = await page.evaluate((): boolean => {
                    const docs: any = document.scrollingElement
                    if (docs.scrollTop + window.innerHeight >= docs.scrollHeight) {
                        return true
                    } else {
                        return false
                    }
                })
                console.log('scrollStop', scrollStop, `link : ${item.link}`)
                if (scrollStop) {
                    isLoadingAvailable = false
                }
            }

            const pageData = await page.evaluate(() => {
                return {
                    html: document.documentElement.innerHTML,
                }
            })
            const $ = cheerio.load(pageData.html)

            // click close popup
            const popup = $('main').find('.popup-fullscreen').length

            if (popup > 0) {
                await page.click('.section-btn-popup > button')
            }

            // selector element
            const containerElement = $('#container-product-filter')
            const productGrid = containerElement.find('.row-product-grid.el-row:last').find('.el-col')

            // write csv
            const csvFile = fs.createWriteStream(path.resolve(__dirname, `../${i}_${item.breadcrumb}.csv`))
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
        }
        await browser.close()
    } catch (e) {
        console.log(e)
    }
}