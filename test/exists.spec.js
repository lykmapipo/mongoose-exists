'use strict';


/* dependencies */
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const faker = require('faker');
const expect = require('chai').expect;

/* use as global plugin */
// mongoose.plugin(require(path.join(__dirname, '..')));


/* prepare schemas */
const FriendSchema = new Schema({
  type: { type: String },
  person: { type: ObjectId, ref: 'Person', exists: true }
});

const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', exists: true },
  relatives: { type: [ObjectId], ref: 'Person', exists: true },
  referees: [{ type: ObjectId, ref: 'Person', exists: true }],
  friends: { type: [FriendSchema] },
  neighbours: [FriendSchema]
});
PersonSchema.plugin(require(path.join(__dirname, '..')));
const Person = mongoose.model('Person', PersonSchema);


describe('mongoose-exists', function () {

  let father = {
    name: faker.company.companyName()
  };

  let relatives = [{
    name: faker.name.findName()
  }, {
    name: faker.name.findName()
  }];

  let referees = [{
    name: faker.name.findName()
  }, {
    name: faker.name.findName()
  }];

  let friends = [{
    name: faker.name.findName()
  }, {
    name: faker.name.findName()
  }];

  let neighbours = [{
    name: faker.name.findName()
  }, {
    name: faker.name.findName()
  }];

  before(function (done) {
    Person.create(father, function (error, created) {
      father = created;
      done(error, created);
    });
  });

  before(function (done) {
    Person.insertMany(relatives, function (error, created) {
      relatives = created;
      done(error, created);
    });
  });

  before(function (done) {
    Person.insertMany(referees, function (error, created) {
      referees = created;
      done(error, created);
    });
  });

  before(function (done) {
    Person.insertMany(friends, function (error, created) {
      friends = _.map(created, function (friend) {
        return {
          type: faker.hacker.ingverb(),
          person: friend
        };
      });
      done(error, created);
    });
  });

  before(function (done) {
    Person.insertMany(neighbours, function (error, created) {
      neighbours = _.map(created, function (neighbour) {
        return {
          type: faker.hacker.ingverb(),
          person: neighbour
        };
      });
      done(error, created);
    });
  });

  it('should be able to create with a ref that already exists',
    function (done) {

      const person = {
        father: father,
        name: faker.company.companyName(),
        relatives: relatives,
        referees: referees,
        friends: friends,
        neighbours: neighbours
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

      const person = {
        father: new mongoose.Types.ObjectId(),
        name: faker.company.companyName()
      };

      Person.create(person, function (error /*, created*/ ) {

        expect(error).to.exist;
        expect(error.errors.father).to.exist;
        expect(error.name).to.be.equal('ValidationError');
        expect(error.errors.father.message)
          .to.be.equal('father with id ' + person.father +
            ' does not exists');

        done();

      });

    });

  it('should fail to save with ref that not exists',
    function (done) {

      const person = {
        father: father._id,
        name: faker.company.companyName(),
        relatives: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      };

      Person.create(person, function (error /*, created*/ ) {

        expect(error).to.exist;
        expect(error.errors.relatives).to.exist;
        expect(error.name).to.be.equal('ValidationError');
        expect(error.errors.relatives.message)
          .to.be.equal('relatives with id ' + person.relatives +
            ' does not exists');

        done();

      });

    });

  it('should fail to save with ref that not exists',
    function (done) {

      const person = {
        father: father._id,
        name: faker.company.companyName(),
        referees: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      };

      Person.create(person, function (error /*, created*/ ) {

        expect(error).to.exist;
        expect(error.errors.referees).to.exist;
        expect(error.name).to.be.equal('ValidationError');
        expect(error.errors.referees.message)
          .to.be.equal('referees with id ' + person.referees +
            ' does not exists');

        done();

      });

    });

  it('should fail to save with ref that not exists',
    function (done) {

      const person = {
        father: father._id,
        name: faker.company.companyName(),
        friends: [{
          type: faker.hacker.ingverb(),
          person: new mongoose.Types.ObjectId()
        }],
      };

      Person.create(person, function (error /*, created*/ ) {

        expect(error).to.exist;
        expect(error.errors['friends.0.person']).to.exist;
        expect(error.name).to.be.equal('ValidationError');
        expect(error.errors['friends.0.person'].message)
          .to.be.equal('person with id ' + person.friends[0].person +
            ' does not exists');

        done();

      });

    });

  after(function (done) {
    Person.remove(done);
  });

});