{
  "namepace": [
    "Data",
    "Trampoline"
  ],
  "imports": [
    {
      "$type": "Imports",
      "namespace": [
        "Data",
        "Unit"
      ],
      "names": [
        "unit"
      ],
      "$location": {
        "offset": 166,
        "line": 11,
        "character": 1
      }
    }
  ],
  "entities": [
    {
      "$type": "TypePolymorphic",
      "variables": [
        "A"
      ],
      "type": {
        "$type": "Model",
        "name": "Done",
        "variables": [
          {
            "$type": "TypeVariable",
            "name": "A"
          }
        ],
        "params": [
          {
            "$type": "Param",
            "name": "_",
            "type": {
              "$type": "TypeVariable",
              "name": "A",
              "$location": {
                "offset": 238,
                "line": 14,
                "character": 24
              }
            },
            "$location": {
              "offset": 232,
              "line": 14,
              "character": 18
            }
          }
        ],
        "parent": {
          "$type": "Model",
          "name": "Trampoline",
          "variables": [
            {
              "$type": "TypeVariable",
              "name": "A"
            }
          ],
          "params": [],
          "abstract": true
        },
        "$location": {
          "offset": 219,
          "line": 14,
          "character": 5
        }
      },
      "namespace": "Data.Trampoline"
    },
    {
      "$type": "TypePolymorphic",
      "variables": [
        "A"
      ],
      "type": {
        "$type": "Model",
        "name": "More",
        "variables": [
          {
            "$type": "TypeVariable",
            "name": "A"
          }
        ],
        "params": [
          {
            "$type": "Param",
            "name": "_",
            "type": {
              "$type": "TypeFunction",
              "argument": {
                "$type": "TypeVariable",
                "name": "unit",
                "$location": {
                  "offset": 266,
                  "line": 15,
                  "character": 27
                }
              },
              "result": {
                "$type": "TypeSpecialize",
                "type": {
                  "$type": "TypeVariable",
                  "name": "Trampoline"
                },
                "parameters": [
                  {
                    "$type": "TypeVariable",
                    "name": "A",
                    "$location": {
                      "offset": 283,
                      "line": 15,
                      "character": 44
                    }
                  }
                ],
                "$location": {
                  "offset": 283,
                  "line": 15,
                  "character": 44
                }
              },
              "$location": {
                "offset": 266,
                "line": 15,
                "character": 27
              }
            },
            "$location": {
              "offset": 257,
              "line": 15,
              "character": 18
            }
          }
        ],
        "parent": {
          "$type": "Model",
          "name": "Trampoline",
          "variables": [
            {
              "$type": "TypeVariable",
              "name": "A"
            }
          ],
          "params": [],
          "abstract": true
        },
        "$location": {
          "offset": 244,
          "line": 15,
          "character": 5
        }
      },
      "namespace": "Data.Trampoline"
    },
    {
      "$type": "TypePolymorphic",
      "variables": [
        "A"
      ],
      "type": {
        "$type": "Model",
        "name": "Trampoline",
        "variables": [
          {
            "$type": "TypeVariable",
            "name": "A"
          }
        ],
        "params": [],
        "abstract": true
      },
      "namespace": "Data.Trampoline"
    },
    {
      "$type": "TypePolymorphic",
      "variables": [
        "A"
      ],
      "type": {
        "$type": "Controller",
        "name": "trampoline",
        "variables": [
          {
            "$type": "TypeVariable",
            "name": "A"
          }
        ],
        "param": {
          "$type": "Param",
          "name": "this",
          "type": {
            "$type": "TypeSpecialize",
            "type": {
              "$type": "TypeVariable",
              "name": "Trampoline"
            },
            "parameters": [
              {
                "$type": "TypeVariable",
                "name": "A",
                "$location": {
                  "offset": 328,
                  "line": 18,
                  "character": 40
                }
              }
            ],
            "$location": {
              "offset": 328,
              "line": 18,
              "character": 40
            }
          }
        },
        "specifications": [
          {
            "$type": "Param",
            "name": "run",
            "type": {
              "$type": "TypeVariable",
              "name": "A",
              "$location": {
                "offset": 342,
                "line": 20,
                "character": 1
              }
            },
            "$location": {
              "offset": 334,
              "line": 19,
              "character": 5
            }
          }
        ],
        "behaviors": []
      },
      "$location": {
        "offset": 289,
        "line": 18,
        "character": 1
      },
      "namespace": "Data.Trampoline"
    }
  ]
}