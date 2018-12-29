'use strict';


/* dependencies */
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const faker = require('faker');
const expect = require('chai').expect;


/* prepare schemas */
const FriendSchema = new Schema({
  type: { type: String },
  person: { type: ObjectId, ref: 'Person', exists: true }
});

const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', exists: true },
  mother: { type: ObjectId, ref: 'Person', exists: [true, 'NOT EXIST'] },
  sister: {
    type: ObjectId,
    ref: 'Person',
    exists: {
      refresh: true,
      message: 'NOT EXIST'
    }
  },
  relatives: { type: [ObjectId], ref: 'Person', exists: true },
  referees: [{ type: ObjectId, ref: 'Person', exists: true }],
  friends: { type: [FriendSchema] },
  neighbours: [FriendSchema]
});
PersonSchema.plugin(require(path.join(__dirname, '..')));
const Person = mongoose.model('Person', PersonSchema);


describe('mongoose-exists', () => {

  let father = { name: faker.company.companyName() };
  let mother = { name: faker.company.companyName() };
  let sister = { name: faker.company.companyName() };

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

  before((done) => {
    Person.create(father, (error, created) => {
      father = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.create(mother, (error, created) => {
      mother = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.create(sister, (error, created) => {
      sister = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(relatives, (error, created) => {
      relatives = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(referees, (error, created) => {
      referees = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(friends, (error, created) => {
      friends = _.map(created, (friend) => {
        return {
          type: faker.hacker.ingverb(),
          person: friend
        };
      });
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(neighbours, (error, created) => {
      neighbours = _.map(created, (neighbour) => {
        return {
          type: faker.hacker.ingverb(),
          person: neighbour
        };
      });
      done(error, created);
    });
  });

  it('should be able to create with a ref that already exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: father._id,
      mother: mother._id,
      sister: sister._id,
      relatives: relatives,
      referees: referees,
      friends: friends,
      neighbours: neighbours
    };

    Person.create(person, (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist;
      expect(created.name).to.be.equal(person.name);
      expect(created.father).to.be.eql(person.father);
      expect(created.mother).to.be.eql(person.mother);
      expect(created.sister._id).to.be.eql(person.sister);
      done(error, created);
    });

  });

  it('should fail to save with ref that not exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: new mongoose.Types.ObjectId()
    };

    Person.create(person, (error /*, created*/ ) => {
      expect(error).to.exist;
      expect(error.errors.father).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors.father.message)
        .to.be.equal('father with id ' + person.father +
          ' does not exists');
      done();
    });
  });

  it(
    'should fail to save with ref that not exists - custom error message',
    (done) => {
      const person = {
        name: faker.company.companyName(),
        father: father,
        mother: new mongoose.Types.ObjectId()
      };

      Person.create(person, (error /*, created*/ ) => {
        expect(error).to.exist;
        expect(error.errors.mother).to.exist;
        expect(error.name).to.be.equal('ValidationError');
        expect(error.errors.mother.message).to.be.equal('NOT EXIST');
        done();
      });
    });

  it(
    'should fail to save with ref that not exists - custom error message',
    (done) => {
      const person = {
        name: faker.company.companyName(),
        father: father,
        mother: mother,
        sister: new mongoose.Types.ObjectId()
      };

      Person.create(person, (error /*, created*/ ) => {
        expect(error).to.exist;
        expect(error.errors.sister).to.exist;
        expect(error.name).to.be.equal('ValidationError');
        expect(error.errors.sister.message).to.be.equal('NOT EXIST');
        done();
      });
    });

  it('should fail to save with ref that not exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: father._id,
      mother: mother._id,
      sister: sister._id,
      relatives: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
    };

    Person.create(person, (error /*, created*/ ) => {
      expect(error).to.exist;
      expect(error.errors.relatives).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors.relatives.message)
        .to.be.equal('relatives with id ' + person.relatives +
          ' does not exists');
      done();
    });
  });

  it('should fail to save with ref that not exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: father._id,
      mother: mother._id,
      sister: sister._id,
      referees: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
    };

    Person.create(person, (error /*, created*/ ) => {
      expect(error).to.exist;
      expect(error.errors.referees).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors.referees.message)
        .to.be.equal('referees with id ' + person.referees +
          ' does not exists');
      done();
    });
  });

  it('should fail to save with ref that not exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: father._id,
      mother: mother._id,
      sister: sister._id,
      friends: [{
        type: faker.hacker.ingverb(),
        person: new mongoose.Types.ObjectId()
      }],
    };

    Person.create(person, (error /*, created*/ ) => {
      expect(error).to.exist;
      expect(error.errors['friends.0.person']).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors['friends.0.person'].message)
        .to.be.equal('person with id ' + person.friends[0].person +
          ' does not exists');
      done();
    });
  });

  after((done) => {
    Person.deleteMany(done);
  });

});