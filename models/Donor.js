const {Schema, model} = require('mongoose');
const unique_validator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {secret} = require('../config');

const DonorSchema = new Schema({
    curp: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true,
		match: [/^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/, "El campo Curp no tiene un formato válido."],
        required: 'El campo Curp es requerido.'
    },
    first_name: {
        type: String,
        trim: true,
        required: 'El campo Nombre(s) es requerido.'
    },
    last_name: {
        type: String,
        trim: true,
        required: 'El campo Apellidos es requerido.'
    },
    date_of_birth: {
        type: String,
        trim: true,
		match: [/^(?:[1][9]|[2][0-9])\d{2}\-(?:1[0-2]|(0)?[1-9])\-(?:(0)?[1-9]|[12]\d|3[01])$/, "El campo Fecha de nacimiento debe tener el formato: YYYY-MM-DD"],
        required: 'El campo Fecha de nacimiento es requerido.'
    },
    gender: {
        type: String,
        trim: true,
        default: 'Prefieron no decir.'
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
		match: [/\S+@\S+\.\S+/, "El campo Correo no tiene un formato válido."],
        required: 'El campo Correo es requerido.',
        index: true
    },
    phone_number: {
        type: String,
        trim: true,
		match: [/^\d{10}$/, "El campo Número de telefono debe tener 10 digitos."]
    },
    place_of_residence: String,
    clave_hospital: String,
    blood_type: {
        type: String,
        trim: true,
        uppercase: true,
		match: [/^(?:A|B|AB|O)[+-]$/, "El tipo de sangre no es valido."],
        required: 'El campo Tipo de sangre es requerido.',
        index: true
    },
    certified_file: {
        type: String,
        trim: true,
        required: 'El campo Archivo certificado es requerido.'
    },
    form_answers: {
        type: Object,
        default: undefined,
        required: 'El Formulario es requerido.'
    },
    status: {
        type: String,
        trim: true,
        required: 'El campo status no esta establecido.',
        enum: ['activo', 'inactivo', 'eliminado']
    },
    hash: String,
    salt: String
}, {timestamps: true});

DonorSchema.plugin(unique_validator, {message: 'El campo {PATH} ya esta en uso.'});

DonorSchema.methods.createPassword = function (password) {
    this.salt = crypto
		.randomBytes(16)
		.toString('hex');
	this.hash = crypto
		.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
		.toString('hex');
}

DonorSchema.methods.validatePassword = function (password) {
    const hash = crypto
        .pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
        .toString('hex');

    return this.hash === hash;
}

DonorSchema.methods.generateJWT = function () {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        id: this.id,
        email: this.email,
        type: 'donor-user',
        exp: parseInt(exp.getTime() / 1000)
    }, secret);
}

DonorSchema.methods.toAuthJson = function () {
    return {
        email: this.email,
        token: this.generateJWT()
    }
}

DonorSchema.methods.publicData = function () {
    return {
        id: this.id,
        first_name: this.first_name,
        last_name: this.last_name,
        gender: this.gender,
        email: this.email,
        place_of_residence: this.place_of_residence,
        clave_hospital: this.clave_hospital,
        blood_type: this.blood_type,
        status: this.status
    }
}

DonorSchema.methods.fullData = function () {
    return {
        id: this.id,
        curp: this.curp,
        first_name: this.first_name,
        last_name: this.last_name,
        date_of_birth: this.date_of_birth,
        gender: this.gender,
        email: this.email,
        phone_number: this.phone_number,
        place_of_residence: this.place_of_residence,
        clave_hospital: this.clave_hospital,
        blood_type: this.blood_type,
        certified_file: this.certified_file,
        form_answers: this.form_answers,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    }
}

model('Donor', DonorSchema);