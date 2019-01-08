const fs = require('fs');
// const util = require('util')
const cycle = require('./cycle')
// const CircularJSON = require('./circular-json.js')
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

let derefLevel1 = (ref) => {
  let property = schema.properties[ref]
  let items = property.items
  return deRef(items)
}

let derefLevel2 = (level1) => {
  let level1Schema = level1['properties']
  for (const iterator of Object.keys(level1Schema)) {
    if (level1Schema[iterator].hasOwnProperty('items') && !level1Schema[iterator].hasOwnProperty('properties')) {
      level1Schema[iterator]['properties'] = deRef(level1Schema[iterator]['items'])['properties']
    }
  }
}

let derefLevel3 = (level1) => {
  let level1Schema = level1['properties']
  for (const iterator of Object.keys(level1Schema)) {
    let level2Schema = level1Schema[iterator]['properties']
    if (level2Schema !== undefined) {
      for (const iterator2 of Object.keys(level2Schema)) {
        if (level2Schema[iterator2].hasOwnProperty('items') && !level2Schema[iterator2].hasOwnProperty('properties')) {
          level2Schema[iterator2]['properties'] = deRef(level2Schema[iterator2]['items'])['properties']
        }
      }
    }
  }
}

let derefLevel4 = (level1) => {
  let level1Schema = level1['properties']
  for (const iterator of Object.keys(level1Schema)) {
    let level2Schema = level1Schema[iterator]['properties']
    if (level2Schema !== undefined) {
      for (const iterator2 of Object.keys(level2Schema)) {
        let level3Schema = level2Schema[iterator2]['properties']
        if (level3Schema !== undefined) {
          for (const iterator3 of Object.keys(level3Schema)) {
            if (level3Schema[iterator3].hasOwnProperty('items') && !level3Schema[iterator3].hasOwnProperty('properties')) {
              level3Schema[iterator3]['properties'] = deRef(level3Schema[iterator3]['items'])['properties']
            }
          }
        }
      }
    }
  }
}

let derefLevel5 = (level1) => {
  let level1Schema = level1['properties']
  for (const iterator of Object.keys(level1Schema)) {
    let level2Schema = level1Schema[iterator]['properties']
    if (level2Schema !== undefined) {
      for (const iterator2 of Object.keys(level2Schema)) {
        let level3Schema = level2Schema[iterator2]['properties']
        if (level3Schema !== undefined) {
          for (const iterator3 of Object.keys(level3Schema)) {
            let level4Schema = level3Schema[iterator3]['properties']
            if (level4Schema !== undefined) {
              for (const iterator4 of Object.keys(level4Schema)) {
                if (level4Schema[iterator4].hasOwnProperty('items') && !level4Schema[iterator4].hasOwnProperty('properties')) {
                  level4Schema[iterator4]['properties'] = deRef(level4Schema[iterator4]['items'])['properties']
                }
              }
            }
          }
        }
      }
    }
  }
}

// let derefLevel6 = (level1) => {
//   let level1Schema = level1['properties']
//   for (const iterator of Object.keys(level1Schema)) {
//     let level2Schema = level1Schema[iterator]['properties']
//     if (level2Schema !== undefined) {
//       for (const iterator2 of Object.keys(level2Schema)) {
//         let level3Schema = level2Schema[iterator2]['properties']
//         if (level3Schema !== undefined) {
//           for (const iterator3 of Object.keys(level3Schema)) {
//             let level4Schema = level3Schema[iterator3]['properties']
//             if (level4Schema !== undefined) {
//               for (const iterator4 of Object.keys(level4Schema)) {
//                 let level5Schema = level4Schema[iterator4]['properties']
//                 if (level5Schema !== undefined) {
//                   for (const iterator5 of Object.keys(level5Schema)) {
//                     if (level5Schema[iterator5].hasOwnProperty('items') && !level5Schema[iterator5].hasOwnProperty('properties')) {
//                       level5Schema[iterator5]['properties'] = deRef(level5Schema[iterator5]['items'])['properties']
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }

let derefMainDocProperty = (property) => {
  let derefSchema = derefLevel1(property)
  derefLevel2(derefSchema)
  derefLevel3(derefSchema)
  derefLevel4(derefSchema)
  derefLevel5(derefSchema)
  // derefLevel6(derefSchema)
  return derefSchema
}

/* -- main doc 
const Order = require('./json-schema/maindoc/UBL-Order-2.1.json')
const schema = Order["definitions"][Object.keys(Order["definitions"])[0]]

let schemaOnlyrequired = {
  "title": "Order",
  "description": "A document used to order goods and services.",
  "additionalProperties": false,
  "type": "object",
  properties: {}
}

//got RangeError: Maximum call stack size exceeded, so process throght level
var requireds = schema.required
for (let required of requireds) {
  schemaOnlyrequired.properties[required] = derefMainDocProperty(required)
}


fs.writeFile("schemaOnlyrequired.json", CircularJSON.stringify(schemaOnlyrequired), function (err) {
  if (err) {
    return console.log(err);
  }

  console.log("The file was saved!");
})
*/
let derefCAC = (ref) => {
  let derefSchema = deRef(ref)
  getProperty(derefSchema)
  return derefSchema
}

// const cac = require('./json-schema/common/UBL-CommonAggregateComponents-2.1.json')
// const ActivityDataLine = derefCAC(cac["definitions"]['ActivityDataLine'])
// console.log(util.inspect(ActivityDataLine))
//CircularJSON.stringify(BuyerContact)
// let temp = customStringify(ActivityDataLine)

/***
 * var jsonString = JSON.stringify(JSON.decycle(jsonObject));
 * var restoredObject = JSON.retrocycle(JSON.parse(jsonString));
 ***/
const Order = require('./json-schema/maindoc/UBL-Order-2.1.json')
const schema = Order["definitions"][Object.keys(Order["definitions"])[0]]
const orderDefObject = derefCAC(schema)
fs.writeFile("orderDefObject1.json", JSON.stringify(JSON.decycle(orderDefObject)), function (err) {
  if (err) {
    return console.log(err);
  }

  console.log("The file was saved!");
})
// var cache = [];
// fs.writeFile("buyerCustomerParty.json", JSON.stringify(buyerCustomerParty, function (key, value) {
//   if (typeof value === 'object' && value !== null) {
//     if (cache.indexOf(value) !== -1) {
//       // Circular reference found, discard key
//       return;
//     }
//     // Store value in our collection
//     cache.push(value);
//   }
//   return value;
// }), function (err) {
//   if (err) {
//     return console.log(err);
//   }

//   console.log("The file was saved!");
// })
// cache = null



