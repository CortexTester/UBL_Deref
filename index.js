const fs = require('fs');

const CTT = require('./json-schema/common/CCTS_CCT_SchemaModule-2.1.json')
const CAC = require('./json-schema/common/UBL-CommonAggregateComponents-2.1.json')
const CBC = require('./json-schema/common/UBL-CommonBasicComponents-2.1.json')
const CEC = require('./json-schema/common/UBL-CommonExtensionComponents-2.1.json')
const ECD = require('./json-schema/common/UBL-ExtensionContentDataType-2.1.json')
const QDT = require('./json-schema/common/UBL-QualifiedDataTypes-2.1.json')
const UDT = require('./json-schema/common/UBL-UnqualifiedDataTypes-2.1.json')

const lookup = new Map()
lookup.set('CCTS_CCT_SchemaModule-2.1', CTT)
lookup.set('UBL-CommonAggregateComponents-2.1', CAC)
lookup.set('UBL-CommonBasicComponents-2.1', CBC)
lookup.set('UBL-CommonExtensionComponents-2.1', CEC)
lookup.set('UBL-ExtensionContentDataType-2.1', ECD)
lookup.set('UBL-QualifiedDataTypes-2.1', QDT)
lookup.set('UBL-UnqualifiedDataTypes-2.1', UDT)

const circulars = new Map()
circulars.set('SubsidiaryLocation', '#/definitions/SubsidiaryLocation')
circulars.set('HeadOfficeParty', '#/definitions/HeadOfficeParty')
circulars.set('Party', '#/definitions/Party')
circulars.set('IssuerParty', '#/definitions/IssuerParty')
circulars.set('SignatoryParty', '#/definitions/SignatoryParty')
circulars.set('AgentParty', '#/definitions/AgentParty')
circulars.set('NotaryParty', '#/definitions/NotaryParty')
circulars.set('WitnessParty', '#/definitions/WitnessParty')

let deRef = (ref, share) => {
    if (ref.hasOwnProperty('properties')) {
        return ref
    }
    else {
        if (!ref.$ref) return ref
        let regexp = ref.$ref.match(/..\/common\/(.*).json#(.*)/)
        if (regexp == null) regexp = ref.$ref.match(/(.*).json#(.*)/)
        if (regexp !== null) {
            let refFile = regexp[1]
            let [, definitions, key] = regexp[2].split('\/')

            let common = lookup.get(refFile)
            return deRef(common[definitions][key], common)
        }
        else {
            regexp = ref.$ref.match(/#(.*)/)
            let [, definitions, key] = regexp[1].split('\/')

            //only exception is UBL-CommonExtensionComponents-2.1
            //solution is add UBL-CommonExtensionComponents-2.1.josn infont of $ref in line 14
            if (definitions === 'definitions' && key === 'UBLExtension') {
                return CEC[definitions][key]
            }

            if (!share) {
                share = CAC
            }

            return deRef(share[definitions][key])
        }
    }
}

let isCircularItem = (iterator, items) => {
    return circulars.has(iterator) && circulars.get(iterator) === items['$ref']
}

let renameProperty = (obj, oldPropertyName, newPropertyName) => {
    delete Object.assign(obj, { [newPropertyName]: obj[oldPropertyName] })[oldPropertyName];
}

let isObject = (obj) => {
    return obj instanceof Object
}

let getProperty = (ObjectWithProperties) => {
    let properties = ObjectWithProperties['properties']
    if (properties !== undefined) {
        for (const iterator of Object.keys(properties)) {
            if (properties[iterator].hasOwnProperty('items') && properties[iterator]['items'].hasOwnProperty('$ref')) {
                if (!isCircularItem(iterator, properties[iterator]['items'])) {
                    properties[iterator]['items']= deRef(properties[iterator]['items'])                                     
                    getProperty(properties[iterator]['items'])
                }
                else {
                    //temporary. should set by $ref
                    if (properties[iterator]['type'] === 'array') {
                        properties[iterator]['type'] = 'string'
                    }
                    properties[iterator]['properties'] = {}
                    if (properties[iterator]['items']['$ref']){
                        delete properties[iterator]['items']['$ref']
                    }
                }                
            }
        }
    }
}

let derefCAC = (ref) => {
    let derefSchema = deRef(ref)
    getProperty(derefSchema)
    return derefSchema
}

let writeFile = (filename, content) => {
    fs.writeFile(filename, JSON.stringify(content), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    })
}

const Order = require('./json-schema/maindoc/UBL-Order-2.1.json')
const schemaBuyerCustomerParty = Order["definitions"]['Order']['properties']['BuyerCustomerParty']['items']
const schemaBuyerCustomerPartyJson = derefCAC(schemaBuyerCustomerParty)
writeFile('schemaBuyerCustomerParty.json', schemaBuyerCustomerPartyJson)

const schemaParty = require('./json-schema/common/UBL-CommonAggregateComponents-2.1.json')['definitions']['Party']
const schemaPartyyJson = derefCAC(schemaParty)
writeFile('party.json', schemaPartyyJson)




