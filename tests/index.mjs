import { Factory, test } from "../src/factory.mjs";

const { register, create } = Factory();

/**
 * Registering a component type
 */
register('hello', {
  private: {
    greeting: "Hello",
  },
  public: {
    name: "world",
    greet() {
      return `${this.greeting}, ${this.public.name}!`;
    }
  },
  init({ name = this.public.name }) {
    this.public.name = name;
  }
})

/**
 * Creating a component
 */

test("Basic")

const world = create("hello", {})
test("hello.greeting is private", !("greeting" in world));
test("hello.name is public", !("greeting" in world));
test("The default greeting is", "Hello, world!", world.greet())

const aunty = create("hello", { name: "Aunty" })
test("The custom greeting is", "Hello, Aunty!", aunty.greet())

aunty.name = "Uncle";
test("hello.name is settable", aunty.name === "Uncle");
test("The new greeting is", "Hello, Uncle!", aunty.greet())

/**
 * Component type inheritance
 */

// override a member

test("Inheritance")


register("hi", {
  extends: "hello",
  private: {
    greeting: "Hi"
  }
})
const hi = create('hi', { name: "Mom" })
test("The greeting is", "Hi, Mom!", hi.greet())

// add a method
register("ask", {
  extends: "hello",
  public: {
    ask(question) {
      return `Hey ${this.public.name}, ${question}?`;
    }
  }
})

const ask = create('ask', { name: "Buddy" })
test("The greeting is", "Hello, Buddy!", ask.greet())
test("The question is", "Hey Buddy, what's up?", ask.ask("what's up"));

// add init

register("greeting", {
  extends: "hello",
  init({ greeting = this.greeting }) {
    this.greeting = greeting;
  }
})

const kiddo = create('greeting', {
  greeting: "Hey",
  name: "Kiddo"
})
test(
  "The greeting is", "Hey, Kiddo!",
  kiddo.greet()
)
/**
 * Multiple inheritance
 */
test("Multiple inheritance")

// Creating components with multiple types
const mister = create("greeting ask", {
  greeting: "Good day",
  name: "Mister"
})
test(
  "The greeting is", "Good day, Mister!",
  mister.greet()
)
test(
  "The question is", "Hey Mister, who do you think you are?",
  mister.ask("who do you think you are")
)



register("person", {
  extends: "greeting ask",
  public: {
    warn(about) {
      return `Watch out for ${about}, ${this.public.name}!`;
    }
  },
});

const doc = create('person', { greeting: "What's up", name: "Doc" });
test(
  "The greeting is", "What's up, Doc!",
  doc.greet()
);
test(
  "The question is", "Hey Doc, what's cooking?",
  doc.ask("what's cooking")
);
test(
  "The warning is",
  "Watch out for the dog, Doc!",
  doc.warn("the dog")
);

register("dear", {
  extends: "hello",
  init() {
    this.public.name = "dear " + this.public.name;
  }
})
const dear = create('dear', { name: "Mother" })
test("The greeting is", "Hello, dear Mother!", dear.greet())


const father = create('dear person', { greeting: "Greetings", name: "Father" });
test("The greeting is", "Greetings, dear Father!", father.greet());
test("The question is", "Hey dear Father, where is Mother?", father.ask("where is Mother"));
test("The warning is", "Watch out for monsters, dear Father!", father.warn("monsters"));

/**
 * Extending the factory with custom builders
 */
test ("Custom builders");

register("methods", {
  build: {
    methods(def) {
      // def is the "methods" option in the type definition
      for (var name in def) {
        this[name] = this.public[name] = def[name].bind(this);
      }
    }
  }
})
register("officer", {
  extends: "methods",
  methods: {
    title() {
      return `${this.rank} ${this.name}`
    }
  },
  private: {
    name: "",
    rank: "Captain",
    address(message) {
      // this.title works in a private function
      return `${this.title()}! ${message}, sir!`;
    }
  },
  public: {
    // this.title works in a private function
    yessir() {
      return `Yes sir, ${this.title()}!`
    },
    excuse(reason) {
      return this.address(`I was just ${reason}`)
    }
  },
  init({ rank = this.rank, name = this.name }) {
    this.rank = rank;
    this.name = name;
  }
})

const captain = create("officer", { name: "Darling" });

//captain.title works on the public interface
test(
  "The title is", "Captain Darling",
  captain.title()
)

test(
  "The yessir is", "Yes sir, Captain Darling!",
  captain.yessir()
)

test(
  "The excuse is",
  "Captain Darling! I was just cleaning my gun, sir!",
  captain.excuse("cleaning my gun")
)

test();
