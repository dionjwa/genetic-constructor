/*
 need to install npm package csv-parse

 call like this (from project root):

 babel-node ./src/inventory/andrea/convertCsv.js /path/to/parts.csv true forced/path/to/output.json
 babel-node ./src/inventory/andrea/convertCsv.js /path/to/connectors.csv false forced/path/to/output.json

 do not import into client bundle. it will break it.
 */

import * as fileSystem from '../../server/utils/fileSystem';
import invariant from 'invariant';
import Block from '../../src/models/Block';
import parse from 'csv-parse';
import md5 from 'md5';
import path from 'path';

//edit these dependent on the spreadsheet
const partFields = ['position', 'part', 'shortName', 'category', 'subCategory', 'sequence', 'description'];
const connectorFields = ['connector', 'positions', 'sequence'];

const headerRows = 2;

//converting categories
const roleMap = {
  'Homology Arm': '',
  'inverted terminal repeat sequences (ITRs)': '',
  'Insulators': 'insulator',
  'Promoters': 'promoter',
  'RNA regulatory sequences': 'regulatory',
  'Site-specific recombinases recognition sites': '',
  'Peptide Tags': 'tag',
  'Site-specific recombinases': '',
  'RNA-Binding proteins': '',
  'Fluorescent Reporter': 'reporter',
  'Peptide Linker': 'structural',
  '2A-like peptide sequences': '',
  'IRES (Internal Ribosome Entry Sequence)': 'rbs',
  'Selection Markers': 'selection',
  'Dimerization domain': 'structural',
  'Bioluminescent Reporters': 'reporter',
  'Structural proteins': 'structural',
  'PolyA transcription terminators': 'terminator',
  'Transcription Factor': '',
  'Episomal elements': '',
};

const trimSequence = (sequence, front = "5'-CGTCTCnNNNN".length, back = "NNNNnGAGACG-3'".length) => {
  const len = sequence.length;
  return sequence.substring(front, len - back);
};

const zip = (keys, vals) => keys.reduce(
  (acc, key, ind) => Object.assign(acc, { [key]: vals[ind] }), {}
);

const mapPartFields = (imported) => {
  //fields based on array at top
  const { part, description, position, role, sequence, category, subCategory, shortName, ...rest } = imported;
  const id = part;

  return {
    metadata: {
      name: part,
      description: description,
      shortName,
      egfPosition: position,
    },
    source: {
      source: 'egf',
      id,
    },
    rules: {
      role: role,
    },
    notes: {
      category,
      'sub-category': subCategory,
      ...rest,
    },
    sequence: sequence, //this field is removed later to conform to schema
  };
};

const mapConnectorFields = (imported) => {
  //fields based on array at top
  const { connector, positions, sequence} = imported;
  const id = connector;

  return {
    metadata: {
      name: connector,
      egfPosition: positions,
    },
    source: {
      source: 'egf',
      id,
    },
    rules: {
      role: 'connector',
    },
    sequence: sequence, //this field is removed later to conform to schema
  };
};

const defaultOutputPath = path.join(__dirname, './partList.json');
const connectorOutputPath = path.join(__dirname, './connectorList.json');

export default function convertCsv(csvPath, isPartInput = 'true', outputPath) {
  invariant(csvPath, 'need a csv path as command line arg');

  const isPart = !(/^false$/i).test(isPartInput);

  return fileSystem.fileRead(csvPath, false)
    .then(contents => {
      return new Promise((resolve, reject) => {
        parse(contents, {}, (err, output) => {
          if (err) return reject(err);
          resolve(output);
        });
      });
    })
    //remove top rows
    .then(lines => lines.slice(headerRows))
    //remove empty lines
    .then(lines => lines.filter(line => line.some(field => !!field)))
    //make object with appropriate keys
    .then(lines => lines.map(line => zip(isPart ? partFields : connectorFields, line)))
    //assign role (for parts, overridden for connectors)
    .then(parts => parts.map(part => Object.assign(part, { role: roleMap[part.category] || null })))
    //map fields to block fields
    .then(parts => parts.map(part => isPart ? mapPartFields(part) : mapConnectorFields(part)))
    //write sequences to /data/, update sequence field
    .then(parts => Promise.all(parts.map(part => {
      const untrimmed = part.sequence;
      const sequence = trimSequence(untrimmed);
      const sequenceMd5 = md5(sequence);
      const filePath = path.join(__dirname, '../../../data/egf_parts/sequences', sequenceMd5);

      return fileSystem.fileWrite(filePath, sequence, false)
        .then(() => {
          return Object.assign(part, {
            sequence: {
              md5: sequenceMd5,
              length: sequence.length,
              initialBases: sequence.substr(0, 5),
            },
          });
        });
    })))
    //make blocks
    .then(parts => parts.map(part => new Block(part)))
    //write the JSON
    .then(blocks => {
      const path = outputPath || (isPart ? defaultOutputPath : connectorOutputPath);
      return fileSystem.fileWrite(path, blocks);
    });
}

convertCsv.apply(null, process.argv.slice(2));