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

/* dependencies */
const _ = require('lodash');
const { mergeObjects, uniq } = require('@lykmapipo/common');
const {
  eachPath,
  model,
  schemaTypeOptionOf
} = require('@lykmapipo/mongoose-common');
const VALIDATOR_TYPE = 'exists';
const VALIDATOR_MESSAGE = '{PATH} with id {VALUE} does not exists';


// build existance check query
const prepareQuery = (ids, schemaTypeOptions) => {
  // obtain options
  const { ref, exists } = schemaTypeOptions;
  const { match = {}, options = {}, select = '_id' } = exists;

  // obtain ref model
  const Model = model(ref);

  // build exist check query
  let query;
  if (Model) {
    // prepare criteria
    let criteria = {};

    // find default
    if (exists.default) {
      criteria = match;
    }
    // find by ids & match
    else {
      criteria = (
        _.isEmpty(match) ?
        ({ _id: { $in: ids } }) :
        ({ $and: [{ _id: { $in: ids } }, match] })
      );
    }

    // create query
    query = Model.find(criteria).select(select).setOptions(options);
  }

  // return query
  return query;
};


// normalize exists schema option
const normalizeOptions = optns => {
  // prepare defaults
  const defaults = ({
    exists: false, // signal if plugin enabled
    refresh: false, // whether to refresh ref
    default: false, // whether to set default
    select: '_id', // fields to select
    match: {}, // additional conditions to apply
    options: {}, // exist query options
    message: VALIDATOR_MESSAGE // error message
  });

  // handle boolean options (exists: true)
  if (_.isBoolean(optns)) {
    return mergeObjects(defaults, { exists: true });
  }

  // handle array option
  if (_.isArray(optns)) {
    const exists = _.first(optns);
    const message = _.last(optns);
    return mergeObjects(defaults, { exists, message });
  }

  // handle object option
  if (_.isPlainObject(optns)) {
    return mergeObjects(defaults, { exists: true }, optns);
  }

  // bounce if not understood option
  return defaults;
};


// create ref exists validator
const createValidator = (schemaPath, schemaTypeOptions) => {
  // dont use arrow: this will be binded to instance
  return function existsValidator(value, cb) {
    // remember value if was array
    // TODO: use schematype to determine if is array path
    const isArray = _.isArray(value);

    // collect value as set of unique ids
    const ids = uniq(_.map([].concat(value), id => _.get(id, '_id') || id));

    // check if should build validator
    const shouldValidate =
      (schemaTypeOptions.exists.default || !_.isEmpty(ids));

    // back-off in case no ids or default not applied
    if (!shouldValidate) {
      return cb(true);
    }

    // prepare existance check query
    const query = prepareQuery(ids, schemaTypeOptions);

    // back-off if no valid query
    if (!query) {
      return cb(true);
    }

    // execute existence check query
    query.exec(function afterQueryExisting(error, docs) {
      // back-off on query errors
      if (error) {
        return cb(error);
      }

      // back-off documents not saved already
      if (_.isEmpty(docs)) {
        return cb(false);
      }

      // handle documents already exist
      if (schemaTypeOptions.exists.refresh) {
        const _value = (isArray ? docs : _.first(docs));
        if (_.isFunction(this.set)) {
          //update path with refresh value
          this.set(schemaPath, _value);
        }
      }
      // return refs exist
      return cb(true);
    }.bind(this)); // bind to model instance on query results
  };
};


// mongoose exists plugin
const existsPlugin = (schema /*, options*/ ) => {
  // iterate through each schema path, check for ObjectId(ref) 
  // schema fields and apply exists plugin to a schema type(s) 
  // with `exists:true` options
  eachPath(schema, (schemaPath, schemaType) => {
    // collect schemaType options
    const schemaTypeOptions = schemaTypeOptionOf(schemaType);

    // normalize exists schema options
    schemaTypeOptions.exists = normalizeOptions(schemaTypeOptions.exists);

    // check if should apply exist validator
    const { exists, ref } = schemaTypeOptions;
    const shouldApply = (!_.isEmpty(ref) && exists.exists);

    // apply `exists` plugin
    if (shouldApply && _.isFunction(schemaType.validate)) {
      // check if exists validator already added to schema path
      const hasValidator =
        _.find(schemaType.validators, { type: VALIDATOR_TYPE });

      // add ref exists async validation to a schema path
      if (!hasValidator) {
        schemaType.validate({
          isAsync: true,
          validator: createValidator(schemaPath, schemaTypeOptions),
          message: schemaTypeOptions.exists.message,
          type: VALIDATOR_TYPE
        });
      }
    }
  });
};

/* export exists plugin */
module.exports = exports = existsPlugin;