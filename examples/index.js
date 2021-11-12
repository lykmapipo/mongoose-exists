import { connect, model, Schema, ObjectId } from '@lykmapipo/mongoose-common';
import exists from '../src';

const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', exists: true },
  mother: { type: ObjectId, ref: 'Person', exists: { refresh: true } },
});
PersonSchema.plugin(exists);
const Person = model('Person', PersonSchema);

connect(() => {
  Person.create({}, (error, created) => {
    console.log(error, created);
  });
});
