const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const { request } = require('express');
require('dotenv').config();

const url = 'https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki';
const characterUrl = 'https://kimetsu-no-yaiba.fandom.com/wiki/';

const app = express();
// dùng express thay body-parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());
app.use(
	bodyParser.urlencoded({
		limit: '50mb',
		extended: true,
		parameterLimit: 50000,
	})
);

// GET ALL CHARACTERS
app.get('/v1', (req, res) => {
	const thumbnails = [];
	const limit = Number(req.query.limit);
	try {
		axios(url).then(response => {
			const html = response.data;
			const $ = cheerio.load(html); // sử dụng giống jQuery

			$('.portal', html).each(function () {
				const name = $(this).find('a').attr('title');
				const url = $(this).find('a').attr('href');
				const image = $(this).find('a > img').attr('data-src');

				thumbnails.push({
					name,
					url: 'https://demon-slayer-api-cme9.onrender.com/v1' + url.split('/wiki')[1],
					image
				});
			});
			if (limit && limit > 0) {
				res.status(200).json(thumbnails.slice(0, limit));
			} else {
				res.status(200).json(thumbnails);
			}
		});
	} catch (e) {
		res.status(500).json(e);
	}
});

// GET A CHARACTER
app.get('/v1/:character', (req, res) => {
	const titles = [],
		details = [],
		galleries = [];
	const characterObj = {};
	const characters = [];
	try {
		axios(characterUrl + req.params.character).then(response => {
			const html = response.data;
			const $ = cheerio.load(html); // sử dụng giống jQuery

			// get gallery
			$('.wikia-gallery-item', html).each(function () {
				const gallery = $(this).find('a > img').attr('data-src');
				galleries.push(gallery);
			})

			$('aside', html).each(function () {
				// get banner image
				const image = $(this).find('img').attr('src');

				// get the title of character title
				$(this)
					.find('section > div > h3')
					.each(function () {
						titles.push($(this).text());
					});

				//get character details
				$(this)
					.find('section > div > div')
					.each(function () {
						details.push($(this).text());
					});

				if (image !== undefined) {
					// create object with titles as key and details as value
					for (let i = 0; i < titles.length; i++) {
						characterObj[titles[i].toLowerCase()] = details[i];
					}
					characters.push({name: req.params.character.replace('_', ' '), galleries, image, ...characterObj });
				}
			});

			res.status(200).json(characters);
		});
	} catch (e) {
		res.status(500).json(e);
	}
});

app.listen(process.env.PORT || 8080, () => {
	console.log('Server started on port 8080');
});
