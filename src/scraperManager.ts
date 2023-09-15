import puppeteer from 'puppeteer';
import { supportedHosts } from './config';
import sendWebhook from './webhookSender';

class ScraperManager {
    loadedModules: any //TODO create a scraperObj / module TS type
    constructor() {
        this.loadedModules = [];
    }

    async scrape(urlList: URL[]) {
        const browser = await puppeteer.launch({ "headless": "new"});
        for (const url of urlList) {
            const page = await browser.newPage();
            console.log(url.host);
            const scraper = this.selectScraperModule(url.host);
            if (!scraper) {
                console.log(`Host ${url.host} is not supported`);
                continue;
            }
            const scrapedInfoObject = await scraper.scrape(url, page);
            console.log(scrapedInfoObject);
            const status = sendWebhook(
                {
                title: scrapedInfoObject.title,
                url: url.href,
                description: scrapedInfoObject.description,
                footer: {text: scrapedInfoObject.stock, icon_url: ""},
                }
            );
            console.log(status);
        }
        browser.close();
    }

    selectScraperModule(hostname: string) {
        if (!(hostname in supportedHosts)){
            console.log("Website not supported.");
            return null;
        }
        if (!this.loadedModules[hostname]){
            // lazy loading scrapers
            const scraperClass = supportedHosts[hostname];
            this.loadedModules[hostname] = new scraperClass();
        }
        return this.loadedModules[hostname];
    }   
}

export default ScraperManager;