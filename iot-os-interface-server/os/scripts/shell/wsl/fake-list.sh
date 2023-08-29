#!/bin/bash

declare -a fakeList=("one" "two" "three")

jsonArray="["

i=1
for num_name in "${fakeList[@]}"; do
  if (( i > 1 ));then
    jsonArray+=","
  fi

  jsonArray+="{\"counter\":${i}, \"fake\":\"${num_name}\"}";

  (( i += 1 ));
done

jsonArray+="]"


printf "${jsonArray}"