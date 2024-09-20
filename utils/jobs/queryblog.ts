import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

async function getFriendLinks(blogUrl: string): Promise<string[]> {
    try {
        // 发送GET请求获取页面内容
        const response = await axios.get(blogUrl);
        const $ = cheerio.load(response.data);

        const friendLinks: string[] = [];

        // 查找所有链接
        $('a').each((_, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const text = $link.text().toLowerCase();

            // 检查链接文本或URL是否包含表示友情链接的关键词
            if (href && (
                /friend|link|伙伴|友情|链接/.test(text) ||
                /friend|link/.test(href)
            )) {
                friendLinks.push(href);
            }
        });

        return friendLinks;
    } catch (error) {
        console.error('Error fetching friend links:', error);
        return [];
    }
}

interface FriendLink {
    url: string;
    title: string;
}

async function getNestedFriendLinks(blogUrl: string): Promise<FriendLink[]> {
    try {
        const initialLinks = await getFriendLinks(blogUrl);
        const nestedLinks: FriendLink[] = [];
        const baseUrl = new URL(blogUrl);

        for (const link of initialLinks) {
            try {
                // 确保链接是完整的 URL
                const fullLink = new URL(link, baseUrl).href;
                const response = await axios.get(fullLink);
                const $ = cheerio.load(response.data);

                $('a').each((_, element) => {
                    const $link = $(element);
                    const href = $link.attr('href');
                    const title = $link.text().trim();

                    if (!isBlogHome(href)) {
                        return;
                    }

                    if (href && title) {
                        try {
                            const fullHref = new URL(href, fullLink).href;
                            nestedLinks.push({ url: fullHref, title });
                        } catch (urlError) {
                            console.error(`Invalid URL: ${href}`);
                        }
                    }
                });
            } catch (error) {
                console.error(`Error fetching nested links from ${link}:`, error);
            }
        }

        return nestedLinks;
    } catch (error) {
        console.error('Error fetching nested friend links:', error);
        return [];
    }
}

// 检查链接是否是 blog 主页地址
function isBlogHome(url: string | undefined): boolean {
    return url?.endsWith('/') ?? false;
}

// 使用示例
const blogUrl = 'https://yufan.me/';
getNestedFriendLinks(blogUrl)
    .then(links => {
        return links;
    })
    .catch(error => console.error('Error:', error));

export { getFriendLinks, getNestedFriendLinks };
