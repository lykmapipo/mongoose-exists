'use strict';

//dependencies
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const faker = require('faker');
const expect = require('chai').expect;

//apply mongoose-exists plugin
mongoose.plugin(require(path.join(__dirname, '..')));

//prepare schema
const PersonSchema = new Schema({
  name: {
    type: String
  },
  parent: {
    type: ObjectId,
    ref: 'Person',
    exists: true
  }
});
const Person = mongoose.model('Person', PersonSchema);

describe('mongoose-exists', function () {

  let parent = {
    name: faker.company.companyName()
  };

  before(function (done) {
    Person.create(parent, function (error, created) {
      parent = created;
      done(error, created);
    });
  });

  it('should be able to create with a ref that already exists',
    function (done) {

      const person = {
        parent: parent._id,
        name: faker.company.companyName()
      };

      Person.create(person, function (error, created) {

        expect(error).to.not.exist;
        expect(created).to.exist;

        expect(created._id).to.exist;

        expect(created.name).to.be.equal(person.name);

        done(error, created);

      });

    });

  it('should fail to save with ref that not exists',
    function (done) {
      const id = new mongoose.Types.ObjectId();

      const person = {
        parent: id,
        name: faker.company.companyName()
      };

      Person.create(person, function (error /*, created*/ ) {

        expect(error).to.exist;
        expect(error.errors.parent).to.exist;
        expect(error.name).to.be.equal('ValidationError');
        expect(error.errors.parent.message)
          .to.be.equal('parent with id ' + id +
            ' does not exists');

        done();

      });

    });

  after(function (done) {
    Person.remove(done);
  });

});