'use strict';


/**
 * @name exist
 * @description mongoose plugin to ensure assigned ref(s) already exists
 * @license MIT
 * @author lally elias <lallyelias87@mail.com>
 * @since  0.1.0
 * @version 0.1.0
 * @example
 *
 * const PersonSchema = new Schema({
 *   father: {
 *     type: ObjectId,
 *     ref: 'Person',
 *     exists: true
 *   }
 * });
 * 
 */


/* @todo support conditional exists */


/* dependencies */
const _ = require('lodash');
const { mergeObjects } = require('@lykmapipo/common');
const { model } = require('@lykmapipo/mongoose-common');
const VALIDATOR_TYPE = 'exists';
const VALIDATOR_MESSAGE = '{PATH} with id {VALUE} does not exists';

const prepareCriteria = (ids, options) => {
  // TODO handle exists.if/exists.when/exists.and
  const criteria = { $or: [] };
  // find by ids
  if (!_.isEmpty(ids)) {
    criteria.$or = [{ _id: { $in: ids } }, ...criteria.$or];
  }
  // find by default
  if (!_.isEmpty(options) && !_.isEmpty(options.default)) {
    criteria.$or = [...criteria.$or, options.default];
  }
  console.log('criteria', JSON.stringify(criteria));
  // return composed criteria
  return criteria;
};

//handle exists schema option
const normalizeExistOption = option => {

  //const default
  const defaults = { exists: false, refresh: false, select: '_id' };

  //handle boolean options
  if (_.isBoolean(option)) {
    return mergeObjects(defaults, { exists: true });
  }

  //handle array option
  if (_.isArray(option)) {
    return mergeObjects({
      exists: _.first(option),
      message: _.last(option)
    });
  }

  //handle object option
  if (_.isPlainObject(option)) {
    return mergeObjects(defaults, { exists: true }, option);
  }

  //bounce if not understood option
  return defaults;
};


const createValidator = (schemaPath, schemaTypeOptions, existOptions) => {

  return function existsValidator(value, cb) {

    //remember value if was array
    const isArray = _.isArray(value);

    //map value to array
    let ids = [].concat(value);

    //get objectid of the value
    ids = _.map(ids, id => _.get(id, '_id') || id);
    ids = _.compact(ids);

    //extend path validation with existence checks
    const shouldValidate =
      (!_.isEmpty(existOptions.default) || (ids && ids.length > 0));
    console.log(schemaPath, shouldValidate, ids, value, existOptions);
    if (shouldValidate) {

      //obtain ref mongoose model
      const Model = model(schemaTypeOptions.ref);

      //try to lookup for model(s) by their ids
      let query = Model.find(prepareCriteria(ids, existOptions));

      //select plus refreshable fields
      // TODO simplify field selections using select option only
      if (existOptions.refresh || existOptions.default) {
        query.select(existOptions.select);
      }
      //select only _id
      else {
        query.select('_id');
      }
      query.exec(function afterQueryExisting(error, docs) {

        //handle query errors
        if (error) {
          console.log(error);
          cb(false /*, error*/ );
        }

        //handle ref(s) existence
        else {

          //check if documents already exist
          // if (docs && docs.length === ids.length) {
          console.log(schemaPath, docs);
          if (docs && docs.length > 0) {

            //update path with refresh value
            if (existOptions.refresh || existOptions.default) {
              const _value = (isArray ? docs : _.first(docs));
              if (_.isFunction(this.set)) {
                this.set(schemaPath, _value);
              }
            }

            cb(true);
          }

          //documents not saved already
          else {
            cb(false);
          }

        }

      }.bind(this));
    }

    //continue if not ids
    else {
      cb(true);
    }

  };
};


module.exports = exports = function existsPlugin(schema /*, options*/ ) {

  /**
   * @name  exists
   * @description iterate though each schema path, check for ObjectId(ref) 
   * schema fields and apply exists plugin to a schema type(s) 
   * with `exists:true` options
   *              
   * @param {String} schemaPath schema path
   * @param {SchemaType} schemaType valid mongoose schema type
   */
  function exists(schemaPath, schemaType, parentPath) {

    //update path name
    schemaPath = _.compact([parentPath, schemaPath]).join('.');

    //handle sub-schema
    if (schemaType.schema) {
      schemaType.schema.eachPath(function (_schemaPath, _schemaType) {
        exists(_schemaPath, _schemaType, schemaPath);
      });
    }

    //collect schemaType options
    let schemaTypeOptions = {};
    //from normal options
    schemaTypeOptions = mergeObjects(schemaType.options);
    //from caster options
    schemaTypeOptions =
      mergeObjects(schemaTypeOptions, _.get(schemaType, 'caster.options'));

    //ensure schema type is objectid `ref`
    const hasRef = !_.isEmpty(schemaTypeOptions.ref);

    //derive exist schema options
    const existOptions = normalizeExistOption(schemaTypeOptions.exists);

    //check if is allow exist schema type
    const checkExist = (hasRef && existOptions.exists);

    //handle `exist` schema options
    if (checkExist && _.isFunction(schemaType.validate)) {

      //check if exist validator already added to path
      const hasValidator =
        _.find(schemaType.validators, { type: VALIDATOR_TYPE });

      //add model exists async validation
      if (!hasValidator) {
        // if (existOptions.default) {
        //   console.log('set default');
        //   schemaType.default(null);
        // }
        schemaType.validate({
          isAsync: true,
          validator: createValidator(schemaPath, schemaTypeOptions,
            existOptions),
          message: (existOptions.message || VALIDATOR_MESSAGE),
          type: VALIDATOR_TYPE
        });
      }

    }

  }

  //check paths for existence
  schema.eachPath(exists);

};