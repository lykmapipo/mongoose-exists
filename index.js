'use strict';


/**
 * @name exist
 * @description mongoose plugin to ensure assigned ref already exists
 * @author lally elias <lallyelias87@mail.com>
 * @since  0.1.0
 * @version 0.1.0
 * @example
 *
 * const PersonSchema = new Schema({
 *   
 *   parent: {
 *     type: ObjectId,
 *     ref: 'Person',
 *     exists: true
 *   }
 *   
 * });
 */


//dependencies
const _ = require('lodash');
const mongoose = require('mongoose');


module.exports = exports = function (schema /*, options*/ ) {

  /**
   * @name  exists
   * @description iterate though each schema path, check for ObjectId(ref) 
   *              schema fields and apply exists plugin to a schema type(s) 
   *              with `exist:true` options
   *              
   * @param  {String} schemaPath       schema path
   * @param  {SchemaType} schemaType valid mongoose schema type
   */
  function exists(schemaPath, schemaType) {

    //ensure schema type has options
    const hasOptions = _.has(schemaType, 'options');

    //ensure schema type is objectid `ref`
    const isRef = _.get(schemaType, 'instance') === 'ObjectID' &&
      _.has(schemaType.options, 'ref');

    //check for exist schema options
    const hasExistOption = _.get(schemaType, 'options.exists') === true;

    //check if is allow exist schema type
    const checkExist = isRef && hasOptions && hasExistOption;

    //handle `exist:true` schema options
    if (checkExist) {

      //obtain schema type ref
      const ref = schemaType.options.ref;

      //add model exists async validation
      schema.path(schemaPath).validate(function (value, cb) {

        //use path with value only
        const id = value || _.get(value, '_id');
        if (id) {
          //obtain ref mongoose model
          const Model = mongoose.model(ref);

          //try to lookup for the model by its id
          Model
            .findById(id)
            .select('_id')
            .lean()
            .exec(function (error, doc) {

              //handle query errors
              if (error) {
                cb(false, error);
              }

              //handle ref existance
              else {
                //document already exists
                if (doc) {
                  cb(true);
                }
                //document not saved already
                else {
                  cb(false);
                }
              }

            });
        }

      }, '{PATH} with id {VALUE} does not exists');

    }

  }

  //check paths for existance
  schema.eachPath(exists);

};
