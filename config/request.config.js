const express = require("express");

const parse = (req, res, next) => {
    express.urlencoded({ extended: true })(req, res, () => {
        express.json()(req, res, next);
    });
};

module.exports = parse;
