/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

export const FACEBOOK = 'https://www.facebook.com/autodesklifesciences/';
export const TWITTER = 'https://twitter.com/adskLifeScience';
export const YOUTUBE = 'https://www.youtube.com/channel/UC19GH6wqbQMnOe2fF4DZlZA';

// these are the links e.g. used in "Learn More" links

const readmeIO = 'https://geneticconstructor.readme.io/docs/';

const readme = append => `${readmeIO}${append || ''}`;

export const READMEIO = readmeIO;

export const TERMS_OF_SERVICE = '/tos.html';
export const PRIVACY_POLICY = 'http://www.autodesk.com/company/legal-notices-trademarks/privacy-statement';

export const SHARING_CREATIVE_COMMONS_CC0 = readme('publishing-to-the-commons');
export const SHARING_IN_PUBLIC_INVENTORY = readme('publishing-to-the-commons');
