import _ from 'lodash';
import { Schema, ObjectId } from '@lykmapipo/mongoose-common';
import {
  create,
  clear,
  expect,
  faker,
  createTestModel,
} from '@lykmapipo/mongoose-test-helpers';
import exists from '../src';

const Friend = new Schema({
  type: { type: String },
  person: { type: ObjectId, ref: 'Person', exists: true },
});

const Person = createTestModel(
  {
    father: { type: ObjectId, ref: 'Person', exists: true },
    mother: { type: ObjectId, ref: 'Person', exists: [true, 'NOT EXIST'] },
    relatives: { type: [ObjectId], ref: 'Person', exists: true },
    referees: [{ type: ObjectId, ref: 'Person', exists: true }],
    friends: { type: [Friend] },
    neighbours: [Friend],
    sister: {
      type: ObjectId,
      ref: 'Person',
      exists: { refresh: true, message: 'NOT EXIST' },
    },
    coach: {
      type: ObjectId,
      ref: 'Person',
      exists: { default: true, match: { father: null }, select: { name: 1 } },
    },
  },
  { modelName: 'Person' },
  exists
);

describe('mongoose-exists', () => {
  const father = Person.fake();
  const mother = Person.fake();
  const sister = Person.fake();
  const relatives = [Person.fake(), Person.fake()];
  const referees = [Person.fake(), Person.fake()];
  let friends = [Person.fake(), Person.fake()];
  let neighbours = [Person.fake(), Person.fake()];

  before((done) => create(father, mother, sister, done));
  before((done) => create(relatives, referees, done));

  before((done) => {
    create(friends, (error, created) => {
      friends = _.map(created, (friend) => {
        return { type: faker.hacker.ingverb(), person: friend };
      });
      done(error, created);
    });
  });

  before((done) => {
    create(neighbours, (error, created) => {
      neighbours = _.map(created, (neighbour) => {
        return { type: faker.hacker.ingverb(), person: neighbour };
      });
      done(error, created);
    });
  });

  it('should be able to create with refs that already exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: father._id,
      mother: mother._id,
      sister: sister._id,
      relatives,
      referees,
      friends,
      neighbours,
      coach: null,
    };

    Person.create(person, (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist;
      expect(created.coach).to.exist;
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
      father: Person.fake()._id,
    };

    Person.create(person, (error /* , created */) => {
      expect(error).to.exist;
      expect(error.errors.father).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors.father.message).to.be.equal(
        `father with id ${person.father} does not exists`
      );
      done();
    });
  });

  it('should fail to save with ref that not exists - custom error message', (done) => {
    const person = {
      name: faker.company.companyName(),
      father,
      mother: Person.fake()._id,
    };

    Person.create(person, (error /* , created */) => {
      expect(error).to.exist;
      expect(error.errors.mother).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors.mother.message).to.be.equal('NOT EXIST');
      done();
    });
  });

  it('should fail to save with ref that not exists - custom error message', (done) => {
    const person = {
      name: faker.company.companyName(),
      father,
      mother,
      sister: Person.fake()._id,
    };

    Person.create(person, (error /* , created */) => {
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
      relatives: [Person.fake()._id, Person.fake()._id],
    };

    Person.create(person, (error /* , created */) => {
      expect(error).to.exist;
      expect(error.errors.relatives).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors.relatives.message).to.be.equal(
        `relatives with id ${person.relatives} does not exists`
      );
      done();
    });
  });

  it('should fail to save with ref that not exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: father._id,
      mother: mother._id,
      sister: sister._id,
      referees: [Person.fake()._id, Person.fake()._id],
    };

    Person.create(person, (error /* , created */) => {
      expect(error).to.exist;
      expect(error.errors.referees).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors.referees.message).to.be.equal(
        `referees with id ${person.referees} does not exists`
      );
      done();
    });
  });

  it('should fail to save with ref that not exists', (done) => {
    const person = {
      name: faker.company.companyName(),
      father: father._id,
      mother: mother._id,
      sister: sister._id,
      friends: [
        {
          type: faker.hacker.ingverb(),
          person: Person.fake()._id,
        },
      ],
    };

    Person.create(person, (error /* , created */) => {
      expect(error).to.exist;
      expect(error.errors['friends.0.person']).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.errors['friends.0.person'].message).to.be.equal(
        `person with id ${person.friends[0].person} does not exists`
      );
      done();
    });
  });

  after((done) => clear(done));
});
