/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

const config = require('./src/main/config');

if (process.platform !== 'win32') {
    console.log(
        `Unsupported platform: '${process.platform}', you need to visit https://www.segger.com/downloads/jlink`
    );
    process.exit();
}

const axios = require('axios');
const fs = require('fs');
const { mkdir } = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const formatJlinkVersion = version => version.replace('.', '');
const minVersion = formatJlinkVersion(config.bundledJlinkVersion());

const DESTINATION_FILENAME_x64 = `JLink_Windows_${minVersion}_x64.exe`;
const DESTINATION_FILENAME_x86 = `JLink_Windows_${minVersion}_x86.exe`;

const filename_x64 = `JLink_Windows_${minVersion}_x86_64.exe`;
const filename_x86 = `JLink_Windows_${minVersion}_i386.exe`;
const fileUrlx64 = `https://developer.nordicsemi.com/.pc-tools/jlink/${filename_x64}`;
const fileUrlx86 = `https://developer.nordicsemi.com/.pc-tools/jlink/${filename_x86}`;

const outputDirectory = 'build';
const destinationFilex64 = path.join(outputDirectory, DESTINATION_FILENAME_x64);
const destinationFilex86 = path.join(outputDirectory, DESTINATION_FILENAME_x86);

async function downloadChecksum(fileUrl) {
    console.log('Downloading', `${fileUrl}.md5`);
    const { status, data } = await axios.get(`${fileUrl}.md5`);
    if (status !== 200) {
        throw new Error(
            `Unable to download ${fileUrl}.md5. Got status code ${status}`
        );
    }
    return data.split(' ').shift();
}

async function downloadFile(fileUrl, destinationFile) {
    const hash = crypto.createHash('md5');
    const expectedChecksum = await downloadChecksum(fileUrl);
    console.log('Downloading', fileUrl);
    const { status, data: stream } = await axios.get(fileUrl, {
        responseType: 'stream',
    });
    if (status !== 200) {
        throw new Error(
            `Unable to download ${fileUrl}. Got status code ${status}`
        );
    }
    console.log('Saving', destinationFile);
    await mkdir(path.dirname(destinationFile), { recursive: true });
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destinationFile);
        stream.pipe(file);
        stream.on('data', data => hash.update(data));
        stream.on('error', reject);
        stream.on('end', () => {
            file.end();
            const calculatedChecksum = hash.digest('hex');
            if (calculatedChecksum !== expectedChecksum) {
                fs.unlinkSync(destinationFile);
                console.log('Calculated checksum:', calculatedChecksum);
                console.log('Expected checksum:  ', expectedChecksum);
                reject(new Error('Checksum verification failed.'));
            }
            resolve();
        });
    });
}

downloadFile(fileUrlx64, destinationFilex64)
    .catch(error => {
        console.error('\n!!! EXCEPTION', error.message);
        process.exit(-1);
    })
    .then(process.exit);

downloadFile(fileUrlx86, destinationFilex86)
    .catch(error => {
        console.error('\n!!! EXCEPTION', error.message);
        process.exit(-1);
    })
    .then(process.exit);
