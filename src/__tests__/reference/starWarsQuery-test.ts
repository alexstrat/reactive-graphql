import gql from "graphql-tag";
import { take } from "rxjs/operators";

import StarWarsSchema from "./starWarsSchema";
import graphqlObservable from "../../";

const graphql = (schema, query, _arg1?, _arg2?, params?) => {
  return new Promise(resolve => {
    const taggedQuery = gql`
      ${query}
    `;
    graphqlObservable(taggedQuery, schema, params)
      .pipe(take(1))
      .subscribe(resolve);
  });
};

describe("Star Wars Query Tests", () => {
  describe("Basic Queries", () => {
    it("Correctly identifies R2-D2 as the hero of the Star Wars Saga", async () => {
      const query = `
        query {
          hero {
            name
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          hero: {
            name: "R2-D2"
          }
        }
      });
    });

    it("Correctly identifies R2-D2 with alias", async () => {
      const query = `
        query {
          myrobot: hero {
            name
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          myrobot: {
            name: "R2-D2"
          }
        }
      });
    });

    it("Allows us to query for the ID and friends of R2-D2", async () => {
      const query = `
        query HerNameAndFriendsQuery {
          hero {
            id
            name
            friends {
              name
            }
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          hero: {
            id: "2001",
            name: "R2-D2",
            friends: [
              {
                name: "Luke Skywalker"
              },
              {
                name: "Han Solo"
              },
              {
                name: "Leia Organa"
              }
            ]
          }
        }
      });
    });
  });

  // Requires support to nested queries https://jira.mesosphere.com/browse/DCOS-22358
  describe.skip("Nested Queries", () => {
    it("Allows us to query for the friends of friends of R2-D2", async () => {
      const query = `
        query NestedQuery {
          hero {
            name
            friends {
              name
              appearsIn
              friends {
                name
              }
            }
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          hero: {
            name: "R2-D2",
            friends: [
              {
                name: "Luke Skywalker",
                appearsIn: ["NEWHOPE", "EMPIRE", "JEDI"],
                friends: [
                  {
                    name: "Han Solo"
                  },
                  {
                    name: "Leia Organa"
                  },
                  {
                    name: "C-3PO"
                  },
                  {
                    name: "R2-D2"
                  }
                ]
              },
              {
                name: "Han Solo",
                appearsIn: ["NEWHOPE", "EMPIRE", "JEDI"],
                friends: [
                  {
                    name: "Luke Skywalker"
                  },
                  {
                    name: "Leia Organa"
                  },
                  {
                    name: "R2-D2"
                  }
                ]
              },
              {
                name: "Leia Organa",
                appearsIn: ["NEWHOPE", "EMPIRE", "JEDI"],
                friends: [
                  {
                    name: "Luke Skywalker"
                  },
                  {
                    name: "Han Solo"
                  },
                  {
                    name: "C-3PO"
                  },
                  {
                    name: "R2-D2"
                  }
                ]
              }
            ]
          }
        }
      });
    });
  });

  describe("Using IDs and query parameters to refetch objects", () => {
    it("Allows us to query for Luke Skywalker directly, using his ID", async () => {
      const query = `
        query FetchLukeQuery {
          human(id: "1000") {
            name
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          human: {
            name: "Luke Skywalker"
          }
        }
      });
    });

    it("Allows us to create a generic query, then use it to fetch Luke Skywalker using his ID", async () => {
      const query = `
        query FetchSomeIDQuery($someId: String!) {
          human(id: $someId) {
            name
          }
        }
      `;
      const params = { someId: "1000" };
      const result = await graphql(StarWarsSchema, query, null, null, params);
      expect(result).toEqual({
        data: {
          human: {
            name: "Luke Skywalker"
          }
        }
      });
    });

    it("Allows us to create a generic query, then use it to fetch Han Solo using his ID", async () => {
      const query = `
        query FetchSomeIDQuery($someId: String!) {
          human(id: $someId) {
            name
          }
        }
      `;
      const params = { someId: "1002" };
      const result = await graphql(StarWarsSchema, query, null, null, params);
      expect(result).toEqual({
        data: {
          human: {
            name: "Han Solo"
          }
        }
      });
    });

    // Requires support to errors https://jira.mesosphere.com/browse/DCOS-22062
    it.skip("Allows us to create a generic query, then pass an invalid ID to get null back", async () => {
      const query = `
          query humanQuery($id: String!) {
            human(id: $id) {
              name
            }
          }
        `;
      const params = { id: "not a valid id" };
      const result = await graphql(StarWarsSchema, query, null, null, params);
      expect(result).toEqual({
        data: {
          human: null
        }
      });
    });
  });

  describe("Using aliases to change the key in the response", () => {
    it("Allows us to query for Luke, changing his key with an alias", async () => {
      const query = `
        query FetchLukeAliased {
          luke: human(id: "1000") {
            name
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          luke: {
            name: "Luke Skywalker"
          }
        }
      });
    });

    it("Allows us to query for both Luke and Leia, using two root fields and an alias", async () => {
      const query = `
        query FetchLukeAndLeiaAliased {
          luke: human(id: "1000") {
            name
          }
          leia: human(id: "1003") {
            name
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          luke: {
            name: "Luke Skywalker"
          },
          leia: {
            name: "Leia Organa"
          }
        }
      });
    });
  });

  describe("Uses fragments to express more complex queries", () => {
    it("Allows us to query using duplicated content", async () => {
      const query = `
        query DuplicateFields {
          luke: human(id: "1000") {
            name
            homePlanet
          }
          leia: human(id: "1003") {
            name
            homePlanet
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          luke: {
            name: "Luke Skywalker",
            homePlanet: "Tatooine"
          },
          leia: {
            name: "Leia Organa",
            homePlanet: "Alderaan"
          }
        }
      });
    });

    // Require support to fragments https://jira.mesosphere.com/browse/DCOS-22356
    it.skip("Allows us to use a fragment to avoid duplicating content", async () => {
      const query = `
          query UseFragment {
            luke: human(id: "1000") {
              ...HumanFragment
            }
            leia: human(id: "1003") {
              ...HumanFragment
            }
          }

          fragment HumanFragment on Human {
            name
            homePlanet
          }
        `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          luke: {
            name: "Luke Skywalker",
            homePlanet: "Tatooine"
          },
          leia: {
            name: "Leia Organa",
            homePlanet: "Alderaan"
          }
        }
      });
    });
  });

  // Not supporting introspection
  describe("Using __typename to find the type of an object", () => {
    it.skip("Allows us to verify that R2-D2 is a droid", async () => {
      const query = `
        query CheckTypeOfR2 {
          hero {
            __typename
            name
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          hero: {
            __typename: "Droid",
            name: "R2-D2"
          }
        }
      });
    });

    // Requires support to introspection https://jira.mesosphere.com/browse/DCOS-22357
    it.skip("Allows us to verify that Luke is a human", async () => {
      const query = `
        query CheckTypeOfLuke {
          hero(episode: EMPIRE) {
            __typename
            name
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          hero: {
            __typename: "Human",
            name: "Luke Skywalker"
          }
        }
      });
    });
  });

  // Requires support to errors https://jira.mesosphere.com/browse/DCOS-22062
  describe.skip("Reporting errors raised in resolvers", () => {
    it("Correctly reports error on accessing secretBackstory", async () => {
      const query = `
        query HeroNameQuery {
          hero {
            name
            secretBackstory
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          hero: {
            name: "R2-D2",
            secretBackstory: null
          }
        },
        errors: [
          {
            message: "secretBackstory is secret.",
            locations: [{ line: 5, column: 13 }],
            path: ["hero", "secretBackstory"]
          }
        ]
      });
    });

    it("Correctly reports error on accessing secretBackstory in a list", async () => {
      const query = `
        query HeroNameQuery {
          hero {
            name
            friends {
              name
              secretBackstory
            }
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          hero: {
            name: "R2-D2",
            friends: [
              {
                name: "Luke Skywalker",
                secretBackstory: null
              },
              {
                name: "Han Solo",
                secretBackstory: null
              },
              {
                name: "Leia Organa",
                secretBackstory: null
              }
            ]
          }
        },
        errors: [
          {
            message: "secretBackstory is secret.",
            locations: [{ line: 7, column: 15 }],
            path: ["hero", "friends", 0, "secretBackstory"]
          },
          {
            message: "secretBackstory is secret.",
            locations: [{ line: 7, column: 15 }],
            path: ["hero", "friends", 1, "secretBackstory"]
          },
          {
            message: "secretBackstory is secret.",
            locations: [{ line: 7, column: 15 }],
            path: ["hero", "friends", 2, "secretBackstory"]
          }
        ]
      });
    });

    it("Correctly reports error on accessing through an alias", async () => {
      const query = `
        query HeroNameQuery {
          mainHero: hero {
            name
            story: secretBackstory
          }
        }
      `;
      const result = await graphql(StarWarsSchema, query);
      expect(result).toEqual({
        data: {
          mainHero: {
            name: "R2-D2",
            story: null
          }
        },
        errors: [
          {
            message: "secretBackstory is secret.",
            locations: [{ line: 5, column: 13 }],
            path: ["mainHero", "story"]
          }
        ]
      });
    });
  });
});
