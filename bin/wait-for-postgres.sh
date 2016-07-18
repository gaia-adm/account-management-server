#!/bin/bash

set -e

host="$1"
shift
cmd="$@"

echo "cmd $cmd";

until node ./bin/db-healthcheck $host; do
  >&2 echo "Postgres is unavailable at $host - sleeping"
  sleep 30
done

>&2 echo "Postgres is up - executing command"
exec $cmd
