exports.up = function(knex, Promise) {
  return knex.raw('ALTER SEQUENCE users_id_seq RESTART WITH 100').
  then(function() {
    return knex.raw('ALTER SEQUENCE accounts_id_seq RESTART WITH 100')
  });
};

exports.down = function(knex) {
};
