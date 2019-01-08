const fs = require('fs');
const cycle = require('./cycle')
const CircularJSON = require('./circular-json.js')
const Flatted = require('./flatted')
var stringify = require('./json-stringify-safe');
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


let getProperty = (ObjectWithProperties) => {
    let properties = ObjectWithProperties['properties']
    if (properties !== undefined) {
        for (const iterator of Object.keys(properties)) {
            if (properties[iterator].hasOwnProperty('items') && !properties[iterator].hasOwnProperty('properties')) {
                properties[iterator]['properties'] = deRef(properties[iterator]['items'])['properties']
                getProperty(properties[iterator])
            }
        }
    }
}


let derefCAC = (ref) => {
    let derefSchema = deRef(ref)
    getProperty(derefSchema)
    return derefSchema
}

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};


/***
 * var jsonString = JSON.stringify(JSON.decycle(jsonObject));
 * var restoredObject = JSON.retrocycle(JSON.parse(jsonString));
 ***/
// const Order = require('./json-schema/maindoc/UBL-Order-2.1.json')
// const schemaOrder = Order["definitions"][Object.keys(Order["definitions"])[0]]
// const schemaBuyerCustomerParty = Order["definitions"]['Order']['properties']['BuyerCustomerParty']['items']
const schemaParty = require('./UBL-CommonAggregateComponents-Party.json')['definitions']['Party']
const orderDefObject = derefCAC(schemaParty)
const decycleObject = JSON.decycle(orderDefObject)
 fs.writeFile("orderDefObject1.json", JSON.stringify(decycleObject), function (err) {
// fs.writeFile("orderDefObject1.json", CircularJSON.stringify(orderDefObject), function (err) {
// fs.writeFile("orderDefObject1.json", Flatted.stringify(orderDefObject), function (err) {
// fs.writeFile("orderDefObject1.json", stringify(orderDefObject, null, 2), function (err) {

// fs.writeFile("orderDefObject1.json", JSON.stringify(orderDefObject, getCircularReplacer()), function (err) {

    if (err) {
        return console.log(err);
    }

    console.log("The file was saved!");
})




