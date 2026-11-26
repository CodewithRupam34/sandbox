import {
  GameChallenge,
  PlaygroundPreset,
  QuizQuestion,
  SubjectiveQuestion,
  TheoryLesson,
  TopicId,
  VideoLessonTrack,
} from '../types/learning';

export interface ModuleMeta {
  id: TopicId;
  number: string;
  title: string;
  description: string;
  concepts: string[];
}

export const MODULES: Record<TopicId, ModuleMeta> = {
  types: {
    id: 'types',
    number: 'Module 01',
    title: 'Python Data Types',
    description:
      'Every value in Python belongs to a data type. Discover how Python classifies numbers, text, booleans, and collections—and why type behavior shapes every operation.',
    concepts: ['Integer', 'Float', 'String', 'Boolean', 'Type Casting', 'Collections'],
  },
  lists: {
    id: 'lists',
    number: 'Module 02',
    title: 'Python Lists',
    description:
      'Lists store multiple values in one ordered, changeable sequence. Master zero-based indexing, slicing windows, in-place methods, copying, and comprehensions.',
    concepts: ['Indexing', 'Slicing', 'Methods', 'Mutability', 'Copying', 'Comprehensions'],
  },
};

export const THEORY_LESSONS: Record<TopicId, TheoryLesson[]> = {
  types: [
    {
      id: 'types-1',
      title: 'What are Data Types?',
      summary:
        'A data type defines the kind of value stored in memory and determines which operations are valid on it. Unlike statically typed languages (C++ or Java), Python uses dynamic typing: you never declare a variable’s type manually—Python infers it at runtime from the value you assign.',
      deepDive: [
        {
          heading: 'Dynamic Typing & Variable Labels',
          body: 'In Python, a variable name is a label pointing to an object in memory, and the object itself carries the type. That means you can reassign age = 25 (an int) and later assign age = "twenty-five" (a str), though keeping consistent types makes code easier to reason about.',
        },
        {
          heading: 'Why Types Matter for Operations',
          body: 'The + operator behaves completely differently depending on the data type: 10 + 5 performs numeric addition (15), whereas "10" + "5" performs string concatenation ("105"). Mixing an int and a str with + raises a TypeError instead of silently guessing.',
        },
      ],
      pitfall:
        'Trying to combine text and numbers with + (such as "Age: " + 25) raises a TypeError. Convert numbers with str(25) or use an f-string like f"Age: {age}".',
      comparisonTitle: 'Core Scalar Types at a Glance',
      comparisonRows: [
        { label: 'int', behavior: 'Exact whole numbers (no size limit)', example: 'age = 25, temp = -4' },
        { label: 'float', behavior: 'Numbers with decimal point', example: 'price = 3.14, ratio = 10.0' },
        { label: 'str', behavior: 'Ordered sequence of characters', example: 'name = "Python"' },
        { label: 'bool', behavior: 'Logical True or False', example: 'is_ready = True' },
      ],
      diagramTitle: 'Inspect each value node to see its Python type and behavior',
      nodes: [
        {
          label: '25',
          sublabel: 'int',
          pythonType: "<class 'int'>",
          mutable: 'Immutable',
          detail: 'Whole numbers without decimals. Supports +, -, *, // (floor division), and ** (exponentiation).',
        },
        {
          label: '3.14',
          sublabel: 'float',
          pythonType: "<class 'float'>",
          mutable: 'Immutable',
          detail: 'Floating-point numbers with decimal precision. Regular division (/) always returns a float.',
        },
        {
          label: "'Hello'",
          sublabel: 'str',
          pythonType: "<class 'str'>",
          mutable: 'Immutable',
          detail: 'Ordered sequence of Unicode characters wrapped in single or double quotes.',
        },
        {
          label: 'True',
          sublabel: 'bool',
          pythonType: "<class 'bool'>",
          mutable: 'Immutable',
          detail: 'Logical truth value (True or False) returned by comparisons and used in if/while conditions.',
        },
      ],
      code: `age = 25
price = 3.14
name = 'Python'
is_ready = True

print(type(age))
print(type(price))
print(type(name))
print(type(is_ready))
print("Next year:", age + 1)`,
      expectedOutput: `<class 'int'>
<class 'float'>
<class 'str'>
<class 'bool'>
Next year: 26`,
      keyTakeaway:
        'Every object in Python carries its own type—inspect it anytime with type() before combining values.',
    },
    {
      id: 'types-2',
      title: 'Numeric Types & Division Rules',
      summary:
        'Python supports three built-in numeric types: int for whole numbers of arbitrary precision, float for real decimal numbers, and complex for numbers with an imaginary component written with j.',
      deepDive: [
        {
          heading: 'True Division (/) vs Floor Division (//)',
          body: 'In Python 3, single-slash division 10 / 2 always produces a float (5.0), even when the numbers divide evenly. When you specifically want an integer quotient rounded down toward negative infinity, use floor division 10 // 3 (which yields 3).',
        },
        {
          heading: 'Automatic Type Promotion',
          body: 'Whenever an int and a float appear in the same arithmetic expression (e.g., 10 + 4.5), Python promotes the result to a float (14.5) so fractional precision is never silently dropped.',
        },
      ],
      pitfall:
        'Floating-point numbers use binary fractions in hardware, so expressions like 0.1 + 0.2 produce 0.30000000000000004. Use round(val, 2) when formatting display values.',
      comparisonTitle: 'Numeric Operators',
      comparisonRows: [
        { label: '/', behavior: 'True division (always returns float)', example: '7 / 2 -> 3.5' },
        { label: '//', behavior: 'Floor division (quotient rounded down)', example: '7 // 2 -> 3' },
        { label: '%', behavior: 'Modulo (remainder after division)', example: '7 % 2 -> 1' },
        { label: '**', behavior: 'Exponentiation (power)', example: '2 ** 3 -> 8' },
      ],
      diagramTitle: 'Click a numeric node to inspect precision & behavior',
      nodes: [
        {
          label: '10',
          sublabel: 'int',
          pythonType: "<class 'int'>",
          mutable: 'Immutable',
          detail: 'Arbitrary-precision integers. Python never overflows 64-bit integer limits.',
        },
        {
          label: '4.5',
          sublabel: 'float',
          pythonType: "<class 'float'>",
          mutable: 'Immutable',
          detail: 'Double-precision decimal numbers. Even 10.0 is a float because of the decimal point.',
        },
        {
          label: '2 + 3j',
          sublabel: 'complex',
          pythonType: "<class 'complex'>",
          mutable: 'Immutable',
          detail: 'Complex numbers with real (2) and imaginary (3j) parts used in signal processing and physics.',
        },
      ],
      code: `a = 10
b = 4.5
c = 2 + 3j

print(type(a), type(b), type(c))
print("True division:", 10 / 2)
print("Floor division:", 10 // 3)
print("Mixed addition:", a + b)`,
      expectedOutput: `<class 'int'> <class 'float'> <class 'complex'>
True division: 5.0
Floor division: 3
Mixed addition: 14.5`,
      keyTakeaway:
        'Use / when you want exact decimal division, // for whole-number quotients, and j for complex literals.',
    },
    {
      id: 'types-3',
      title: 'Strings, Booleans & Truthiness',
      summary:
        'Strings (str) represent immutable sequences of text characters, while Booleans (bool) represent logical truth using True and False. Every Python value also has an implicit Boolean truthiness when evaluated inside an if statement or bool().',
      deepDive: [
        {
          heading: 'Quoted Text vs Unquoted Keywords',
          body: 'Wrapping characters in single (\'...\') or double ("...") quotes always produces a str. Thus True is a bool, while "True" is a 4-character string. Booleans in Python are strictly capitalized: True and False.',
        },
        {
          heading: 'Truthy & Falsy Values',
          body: 'When converted with bool(x), empty values—0, 0.0, "", [], (), {}, set(), and None—evaluate to False (falsy). Nearly every non-zero number and non-empty container evaluates to True (truthy).',
        },
      ],
      pitfall:
        'bool("False") evaluates to True! Because "False" is a non-empty string with 5 characters, Python considers it truthy.',
      diagramTitle: 'Compare text values, Booleans, and truthiness',
      nodes: [
        {
          label: "'Hello'",
          sublabel: 'str (truthy)',
          pythonType: "<class 'str'>",
          mutable: 'Immutable',
          detail: 'Non-empty string. Supports .upper(), .lower(), .strip(), slicing, and len().',
        },
        {
          label: '""',
          sublabel: 'empty str (falsy)',
          pythonType: "<class 'str'>",
          mutable: 'Immutable',
          detail: 'Empty string of length 0. Evaluates to False when passed to bool("").',
        },
        {
          label: 'True',
          sublabel: 'bool',
          pythonType: "<class 'bool'>",
          mutable: 'Immutable',
          detail: 'Capitalized keyword True. Under the hood, bool is a subclass of int where True == 1.',
        },
        {
          label: "'True'",
          sublabel: 'str (not bool)',
          pythonType: "<class 'str'>",
          mutable: 'Immutable',
          detail: 'Quotes override keyword meaning—this is plain text, not a Boolean.',
        },
      ],
      code: `message = 'Hello Python'
passed = True
empty = ""

print(message.upper())
print(passed, type(passed))
print("bool(empty):", bool(empty))
print("bool('False'):", bool('False'))`,
      expectedOutput: `HELLO PYTHON
True <class 'bool'>
bool(empty): False
bool('False'): True`,
      keyTakeaway:
        'Never wrap True or False in quotes, and remember that any non-empty string is truthy.',
    },
    {
      id: 'types-4',
      title: 'Type Conversion (Casting)',
      summary:
        'Type conversion—often called casting—explicitly transforms a value from one type into another using built-in constructors: int(), float(), str(), bool(), list(), tuple(), and set().',
      deepDive: [
        {
          heading: 'Safe Conversions vs ValueError',
          body: 'int("42") succeeds because "42" contains valid digits, whereas int("hello") raises a ValueError. Similarly, int(4.9) truncates the decimal part toward zero and returns 4 (it does not round up to 5).',
        },
        {
          heading: 'Why User Input Requires Casting',
          body: 'Text coming from forms, files, or input() always arrives as a str. Before doing math on user-entered numbers, convert them with int() or float().',
        },
      ],
      pitfall:
        'Calling int("3.14") directly raises a ValueError because the string contains a decimal point. Convert to float("3.14") first, then int(float("3.14")).',
      diagramTitle: 'Click a conversion call to see how Python transforms the value',
      nodes: [
        {
          label: 'int("42")',
          sublabel: '-> 42',
          pythonType: "<class 'int'>",
          mutable: 'Immutable',
          detail: 'Parses a whole-number string into an integer so arithmetic works.',
        },
        {
          label: 'int(4.9)',
          sublabel: '-> 4',
          pythonType: "<class 'int'>",
          mutable: 'Immutable',
          detail: 'Truncates the fractional portion (.9) rather than rounding.',
        },
        {
          label: 'float(7)',
          sublabel: '-> 7.0',
          pythonType: "<class 'float'>",
          mutable: 'Immutable',
          detail: 'Promotes an integer to a floating-point number.',
        },
        {
          label: 'str(99)',
          sublabel: "-> '99'",
          pythonType: "<class 'str'>",
          mutable: 'Immutable',
          detail: 'Converts any Python object to its readable string representation.',
        },
      ],
      code: `raw_score = "42"
bonus = 8
total = int(raw_score) + bonus

print("Total:", total, type(total))
print("Truncated int(4.9):", int(4.9))
print("As text:", str(total) + " pts")`,
      expectedOutput: `Total: 50 <class 'int'>
Truncated int(4.9): 4
As text: 50 pts`,
      keyTakeaway:
        'int() truncates decimals toward zero instead of rounding; use round() first if you want nearest-integer rounding.',
    },
    {
      id: 'types-5',
      title: 'Collection Types Compared',
      summary:
        'Python offers four primary collection types—list, tuple, set, and dict—each optimized for a different way of organizing data.',
      deepDive: [
        {
          heading: 'Choosing the Right Collection',
          body: 'Use a list when order matters and items will change. Use a tuple for fixed records (like coordinates) that should not be altered. Use a set when you want fast membership checks and automatic duplicate removal. Use a dict when looking up values by meaningful keys.',
        },
      ],
      pitfall:
        'Writing empty {} creates an empty dict, NOT an empty set! Always use set() when you want an empty set.',
      comparisonTitle: 'Python Collection Comparison',
      comparisonRows: [
        { label: 'list []', behavior: 'Ordered, mutable, allows duplicates', example: '[1, 2, 2, 3]' },
        { label: 'tuple ()', behavior: 'Ordered, immutable, allows duplicates', example: '(10, 20)' },
        { label: 'set {}', behavior: 'Unordered, mutable, unique items only', example: '{1, 2, 3}' },
        { label: 'dict {k: v}', behavior: 'Key-value mapping, unique keys', example: "{'a': 1}" },
      ],
      diagramTitle: 'Inspect the four Python collection containers',
      nodes: [
        {
          label: '[1, 2, 2]',
          sublabel: 'list',
          pythonType: "<class 'list'>",
          mutable: 'Mutable',
          detail: 'Ordered, changeable sequence created with square brackets []. Keeps duplicates.',
        },
        {
          label: '(1, 2)',
          sublabel: 'tuple',
          pythonType: "<class 'tuple'>",
          mutable: 'Immutable',
          detail: 'Ordered sequence created with parentheses (). Cannot be modified after creation.',
        },
        {
          label: '{1, 2}',
          sublabel: 'set',
          pythonType: "<class 'set'>",
          mutable: 'Mutable',
          detail: 'Collection of unique items created with curly braces {}. Automatically drops duplicates.',
        },
        {
          label: "{'a': 1}",
          sublabel: 'dict',
          pythonType: "<class 'dict'>",
          mutable: 'Mutable',
          detail: 'Key-value mapping created with {key: value}. Keys must be unique.',
        },
      ],
      code: `my_list = [1, 2, 2, 3]
my_tuple = (1, 2, 3)
my_set = {1, 2, 2, 3}
my_dict = {'a': 1, 'b': 2}

print("List:", my_list)
print("Set:", my_set)
print("Dict keys:", my_dict.keys())
print("Empty {} type:", type({}))`,
      expectedOutput: `List: [1, 2, 2, 3]
Set: {1, 2, 3}
Dict keys: ['a', 'b']
Empty {} type: <class 'dict'>`,
      keyTakeaway:
        'Brackets signal structure: [] for list, () for tuple, {items} for set, and {k: v} for dict (and {} alone is a dict).',
    },
  ],
  lists: [
    {
      id: 'lists-1',
      title: 'What is a List?',
      summary:
        'A list is an ordered, mutable container that holds zero or more values inside square brackets []. Elements keep the exact order you insert them, and duplicate values are allowed.',
      deepDive: [
        {
          heading: 'Heterogeneous & Nested Lists',
          body: 'While lists often hold items of a single type (like [10, 20, 30]), Python lists can also mix types (["Ada", 98, True]) or nest other lists inside them ([[1, 2], [3, 4]]) to model grids or tables.',
        },
        {
          heading: 'Checking Membership & Length',
          body: 'Use len(my_list) to get the number of top-level elements, and use the in operator (20 in numbers) to check whether a value exists in the list.',
        },
      ],
      pitfall:
        'Accessing an index greater than or equal to len(my_list) raises an IndexError. Remember a 4-item list only has valid positive indices 0, 1, 2, and 3.',
      diagramTitle: 'Ordered sequence stored inside square brackets',
      nodes: [
        {
          label: '10',
          sublabel: 'element 0',
          pythonType: "<class 'int'>",
          mutable: 'Inside mutable list',
          detail: 'First element stored in numbers at index 0.',
        },
        {
          label: '20',
          sublabel: 'element 1',
          pythonType: "<class 'int'>",
          mutable: 'Inside mutable list',
          detail: 'Second element stored in numbers at index 1.',
        },
        {
          label: '30',
          sublabel: 'element 2',
          pythonType: "<class 'int'>",
          mutable: 'Inside mutable list',
          detail: 'Third element stored in numbers at index 2.',
        },
        {
          label: '40',
          sublabel: 'element 3',
          pythonType: "<class 'int'>",
          mutable: 'Inside mutable list',
          detail: 'Fourth element stored in numbers at index 3.',
        },
      ],
      code: `numbers = [10, 20, 30, 40]
print(numbers)
print("Length:", len(numbers))
print("Is 20 in numbers?", 20 in numbers)
print(type(numbers))`,
      expectedOutput: `[10, 20, 30, 40]
Length: 4
Is 20 in numbers? True
<class 'list'>`,
      keyTakeaway:
        'Lists preserve insertion order, allow duplicates, and work with len() and the in operator.',
    },
    {
      id: 'lists-2',
      title: 'Indexing (Positive & Negative)',
      summary:
        'Every slot in a Python list has two integer addresses: a positive index counting forward from 0, and a negative index counting backward from -1.',
      deepDive: [
        {
          heading: 'Why Zero-Based Indexing?',
          body: 'Think of an index as an offset from the start of the list: the first element is 0 steps from the start (numbers[0]), the second is 1 step away (numbers[1]), and so on.',
        },
        {
          heading: 'Negative Indexing Convenience',
          body: 'Instead of writing numbers[len(numbers) - 1] to read the final item, Python lets you write numbers[-1]. Similarly, numbers[-2] gets the second-to-last item.',
        },
      ],
      pitfall:
        'If a list is empty ([]), even numbers[0] or numbers[-1] raises IndexError: list index out of range. Always check len(numbers) > 0 if a list might be empty.',
      diagramTitle: 'Click any slot to inspect both positive and negative indices',
      nodes: [
        {
          label: '10',
          sublabel: 'idx 0 / -4',
          pythonType: 'numbers[0]',
          mutable: 'First item',
          detail: 'Zero-based indexing always places the first item at index 0 (or -len(list)).',
        },
        {
          label: '20',
          sublabel: 'idx 1 / -3',
          pythonType: 'numbers[1]',
          mutable: 'Second item',
          detail: 'Accessible via numbers[1] or numbers[-3].',
        },
        {
          label: '30',
          sublabel: 'idx 2 / -2',
          pythonType: 'numbers[2]',
          mutable: 'Third item',
          detail: 'Accessible via numbers[2] or numbers[-2].',
        },
        {
          label: '40',
          sublabel: 'idx 3 / -1',
          pythonType: 'numbers[-1]',
          mutable: 'Last item',
          detail: 'numbers[-1] always returns the final item regardless of list length.',
        },
      ],
      code: `numbers = [10, 20, 30, 40]
print("First:", numbers[0])
print("Third:", numbers[2])
print("Last:", numbers[-1])
print("Second from end:", numbers[-2])`,
      expectedOutput: `First: 10
Third: 30
Last: 40
Second from end: 30`,
      keyTakeaway:
        'Index 0 is always the first element, and index -1 is always the last element.',
    },
    {
      id: 'lists-3',
      title: 'Slicing & Step Windows',
      summary:
        'Slicing extracts a brand-new list using list[start:stop:step]. The start index is inclusive, the stop index is exclusive, and an optional step controls stride and direction.',
      deepDive: [
        {
          heading: 'Defaults for Omitted Bounds',
          body: 'Omitting start defaults to the beginning (numbers[:2] gives the first two items). Omitting stop defaults to the end (numbers[2:] gives everything from index 2 onward). Writing numbers[:] creates a shallow copy of the entire list!',
        },
        {
          heading: 'Step & Reversal Slicing',
          body: 'A step of 2 (numbers[::2]) picks every second item. A step of -1 (numbers[::-1]) walks backward from the end and returns a reversed copy without mutating the original list.',
        },
      ],
      pitfall:
        'Unlike single-item indexing, out-of-bounds slice indices (like numbers[1:99]) do NOT raise an IndexError—Python simply stops at the end of the list.',
      comparisonTitle: 'Essential Slice Patterns',
      comparisonRows: [
        { label: 'a[1:3]', behavior: 'Items at index 1 and 2 (3 excluded)', example: '[20, 30]' },
        { label: 'a[:2]', behavior: 'First 2 items from start', example: '[10, 20]' },
        { label: 'a[2:]', behavior: 'From index 2 to the end', example: '[30, 40]' },
        { label: 'a[::-1]', behavior: 'Reversed shallow copy', example: '[40, 30, 20, 10]' },
      ],
      diagramTitle: 'Slice window numbers[1:3] includes index 1 and 2, stops before 3',
      nodes: [
        {
          label: '10',
          sublabel: 'idx 0 (excluded)',
          pythonType: 'Before start',
          mutable: 'Skipped',
          detail: 'Index 0 is before the slice start (1), so it is not included.',
        },
        {
          label: '20',
          sublabel: 'idx 1 (included)',
          pythonType: 'In slice [1:3]',
          mutable: 'Included',
          detail: 'Start index 1 is inclusive, so 20 is the first element of the slice.',
        },
        {
          label: '30',
          sublabel: 'idx 2 (included)',
          pythonType: 'In slice [1:3]',
          mutable: 'Included',
          detail: 'Index 2 is less than stop index 3, so 30 is included.',
        },
        {
          label: '40',
          sublabel: 'idx 3 (excluded)',
          pythonType: 'Stop boundary',
          mutable: 'Excluded',
          detail: 'Stop index 3 is exclusive—slicing always stops right before the stop index.',
        },
      ],
      code: `numbers = [10, 20, 30, 40]
print("Slice [1:3]:", numbers[1:3])
print("Prefix [:2]:", numbers[:2])
print("Every 2nd [::2]:", numbers[::2])
print("Reversed [::-1]:", numbers[::-1])`,
      expectedOutput: `Slice [1:3]: [20, 30]
Prefix [:2]: [10, 20]
Every 2nd [::2]: [10, 30]
Reversed [::-1]: [40, 30, 20, 10]`,
      keyTakeaway:
        'Start is inclusive, stop is exclusive, and slicing always returns a new list without altering the original.',
    },
    {
      id: 'lists-4',
      title: 'List Methods (In-Place Mutation)',
      summary:
        'List methods like append(), insert(), remove(), pop(), and sort() modify the list directly in memory. Most mutating methods return None—only pop() returns the removed item.',
      deepDive: [
        {
          heading: 'Why x = my_list.append(5) is a Bug',
          body: 'Because append() and sort() mutate the list in place, they return None so you know no new copy was created. Assigning x = my_list.sort() overwrites x with None! Call my_list.sort() on its own line, or use sorted(my_list) if you want a new sorted copy.',
        },
        {
          heading: 'remove() vs pop()',
          body: 'remove(value) searches for a matching value and deletes its first occurrence. pop(index) targets a position (defaulting to -1, the last item), removes it, and hands that value back to you.',
        },
      ],
      pitfall:
        'Writing nums = nums.append(40) sets nums to None! Always call nums.append(40) as a standalone statement.',
      comparisonTitle: 'Core Mutating Methods',
      comparisonRows: [
        { label: 'append(x)', behavior: 'Adds x to end; returns None', example: 'nums.append(40)' },
        { label: 'insert(i, x)', behavior: 'Inserts x at index i; returns None', example: 'nums.insert(1, 15)' },
        { label: 'remove(x)', behavior: 'Deletes first value x; returns None', example: 'nums.remove(20)' },
        { label: 'pop(i)', behavior: 'Removes item at i & returns it', example: 'val = nums.pop()' },
      ],
      diagramTitle: 'Click a method to inspect how it updates the list',
      nodes: [
        {
          label: 'append(x)',
          sublabel: 'Add at end',
          pythonType: 'Returns None',
          mutable: 'Mutates list',
          detail: 'Appends x to the tail of the list in constant O(1) amortized time.',
        },
        {
          label: 'insert(i, x)',
          sublabel: 'Add at index i',
          pythonType: 'Returns None',
          mutable: 'Mutates list',
          detail: 'Inserts x at index i and shifts subsequent elements one slot right.',
        },
        {
          label: 'remove(x)',
          sublabel: 'Delete value x',
          pythonType: 'Returns None',
          mutable: 'Mutates list',
          detail: 'Removes the first occurrence of value x. Raises ValueError if x is missing.',
        },
        {
          label: 'pop(i)',
          sublabel: 'Remove & return',
          pythonType: 'Returns item',
          mutable: 'Mutates list',
          detail: 'Removes the element at index i (default: last element) and returns it.',
        },
      ],
      code: `numbers = [10, 20, 30]
numbers.append(40)
numbers.insert(1, 15)
numbers.remove(20)
removed = numbers.pop()

print("Updated:", numbers)
print("Popped:", removed)`,
      expectedOutput: `Updated: [10, 15, 30]
Popped: 40`,
      keyTakeaway:
        'Mutating methods change the list in place and return None (except pop(), which returns the removed item).',
    },
    {
      id: 'lists-5',
      title: 'Mutability, Copying & Comprehensions',
      summary:
        'Because lists are mutable, assigning b = a does NOT copy the list—both variables point to the exact same list in memory. Use .copy() or slicing [:] when you need an independent copy, and use list comprehensions to transform lists concisely.',
      deepDive: [
        {
          heading: 'Reference Aliasing vs Copying',
          body: 'If you write b = a and then b.append(99), a also gets 99 because a and b are two names for one list object. Writing b = a.copy() creates a separate list so mutating b leaves a untouched.',
        },
        {
          heading: 'List Comprehensions',
          body: 'A list comprehension builds a new list in one readable expression: [x * 2 for x in nums if x > 10]. It replaces verbose append loops with clear declarative syntax.',
        },
      ],
      pitfall:
        'Writing backup = scores creates an alias, not a backup! Always use backup = scores.copy() or backup = scores[:] before mutating.',
      diagramTitle: 'Inspect reference aliasing vs independent copying',
      nodes: [
        {
          label: 'a = [10, 20]',
          sublabel: 'Original list',
          pythonType: 'List object #1',
          mutable: 'Mutable',
          detail: 'Creates the initial list object in memory.',
        },
        {
          label: 'b = a',
          sublabel: 'Alias (same object)',
          pythonType: 'Points to #1',
          mutable: 'Shared mutation',
          detail: 'Mutating b also mutates a because both labels point to the same list.',
        },
        {
          label: 'c = a.copy()',
          sublabel: 'True copy',
          pythonType: 'List object #2',
          mutable: 'Independent',
          detail: 'Creates a brand-new list object with the same elements.',
        },
      ],
      code: `a = [10, 20, 30]
b = a.copy()
b[0] = 99

doubled = [x * 2 for x in a]
print("Original a:", a)
print("Independent b:", b)
print("Comprehension:", doubled)`,
      expectedOutput: `Original a: [10, 20, 30]
Independent b: [99, 20, 30]
Comprehension: [20, 40, 60]`,
      keyTakeaway:
        'Use .copy() or [:] to duplicate a list safely, and list comprehensions to map or filter items cleanly.',
    },
  ],
};

export const ANIMATED_VIDEO_TRACKS: Record<TopicId, VideoLessonTrack[]> = {
  types: [
    {
      id: 'type-int',
      topic: 'types',
      shortLabel: 'int',
      title: 'Integers (int)',
      subtitle: 'Whole numbers, arbitrary precision, // floor division, and int() truncation.',
      detailedConcepts: [
        'Integers store positive, negative, and zero whole numbers with no decimal point (e.g., -7, 0, 25, 1000000).',
        'Python ints have arbitrary precision—they grow automatically without 32-bit or 64-bit overflow.',
        'Floor division (7 // 2) returns 3 (an int), whereas single-slash division (7 / 2) always returns a float (3.5).',
        'Calling int(4.9) truncates toward zero and produces 4—it never rounds up to 5.',
        'Calling int("45") converts numeric strings to int for arithmetic, while int("hello") raises ValueError.',
      ],
      examQuestions: [
        {
          q: 'What does print(type(42)) output?',
          answer: "<class 'int'>",
          note: 'Any whole number literal without quotes or a decimal point is an int.',
        },
        {
          q: 'What is the result of int(4.9) in Python?',
          answer: '4',
          note: 'int() truncates the fractional part toward zero rather than rounding.',
        },
        {
          q: 'What is the difference between 10 / 2 and 10 // 2?',
          answer: '5.0 (float) vs 5 (int)',
          note: 'Single slash / always produces a float in Python 3; // performs floor division.',
        },
        {
          q: 'How do you fix TypeError when adding raw = "45" and 5?',
          answer: 'int(raw) + 5 -> 50',
          note: 'Strings cannot be added to ints directly without casting via int().',
        },
      ],
      stages: [
        {
          id: 't-int-1',
          title: 'Scene 1: Whole Numbers Jump into int',
          narration:
            'Whenever you write a positive, negative, or zero number without a decimal point or quotes, Python dynamically binds the variable to <class "int"> with unlimited precision.',
          spokenScript:
            'Integers in Python. When you write age equals 25, temperature equals minus 7, or count equals zero with no decimal point and no quotes, Python tags each value as an integer. Unlike C or Java, Python integers never overflow even for huge numbers.',
          codeLine: 'age = 25 | temp = -7 | big = 999999999999',
          animationKind: 'jump-in',
          actionBadge: 'Tagged as <class "int">',
          items: [
            { id: 'i1', label: '25', tag: 'int', added: true, stateLabel: 'Positive' },
            { id: 'i2', label: '-7', tag: 'int', added: true, stateLabel: 'Negative' },
            { id: 'i3', label: '0', tag: 'int', added: true, stateLabel: 'Zero' },
            { id: 'i4', label: '10**20', tag: 'int', added: true, stateLabel: 'No overflow' },
          ],
        },
        {
          id: 't-int-2',
          title: 'Scene 2: Floor Division // vs Single Slash /',
          narration:
            'Double-slash floor division (7 // 2) discards the decimal remainder and stays an int (3), whereas single-slash division (10 / 2) always converts the result to a float (5.0).',
          spokenScript:
            'A very common exam question compares single slash and double slash division. Seven floor divided by two equals three, staying an integer. Even when numbers divide evenly, ten single slash two returns five point zero as a float.',
          codeLine: '7 // 2 -> 3 (int)  |  10 / 2 -> 5.0 (float)',
          animationKind: 'type-box',
          actionBadge: '7 // 2 -> 3 (int)',
          returnedValue: '3',
          items: [
            { id: 'i5', label: '7 // 2', tag: 'floor div', dimmed: true, stateLabel: 'Drops remainder' },
            { id: 'i6', label: '3', tag: 'int', highlight: true, stateLabel: 'Whole quotient' },
            { id: 'i7', label: '10 / 2 -> 5.0', tag: 'float', stateLabel: 'Single / trap' },
          ],
        },
        {
          id: 't-int-3',
          title: 'Scene 3: Truncation with int(4.9) & String Casting',
          narration:
            'Calling int(4.9) cuts off .9 toward zero returning 4 (not 5!). Similarly, int("45") turns digit text into a real integer so you can add numbers.',
          spokenScript:
            'Watch out for the int casting trap. Calling int on four point nine does not round up to five—it chops off the decimal and gives four. Meanwhile, int on quoted forty five turns text into a real integer. Solve this checkpoint.',
          codeLine: 'int(4.9) -> 4  |  int("45") + 5 -> 50',
          animationKind: 'pop-fade',
          actionBadge: '.9 truncated -> 4',
          returnedValue: '4',
          items: [
            { id: 'i8', label: '4', tag: 'int', highlight: true, stateLabel: 'Kept' },
            { id: 'i9', label: '.9', tag: 'fraction', removed: true, stateLabel: 'Truncated!' },
            { id: 'i10', label: 'int("45")', tag: '45', highlight: true, stateLabel: 'Text -> int' },
          ],
          checkpoint: {
            question: 'What does print(int(4.9), 7 // 2) output in Python?',
            options: ['5 3.5', '4 3', '5 3', '4 3.5'],
            correctIndex: 1,
            explanation: 'int(4.9) truncates to 4 and floor division 7 // 2 evaluates to integer 3.',
          },
        },
      ],
    },
    {
      id: 'type-float',
      topic: 'types',
      shortLabel: 'float',
      title: 'Floating-Point (float)',
      subtitle: 'Decimal literals (10.0), / division, scientific notation, and mixed math.',
      detailedConcepts: [
        'Any literal written with a decimal point—including 10.0 or 0.0—is stored as <class "float">.',
        'Scientific notation like 1.5e3 (= 1500.0) also creates a float automatically.',
        'Single-slash division (/) in Python 3 ALWAYS yields a float, even for 10 / 2 -> 5.0.',
        'Mixing an int and a float in arithmetic (e.g., 5 + 2.0) automatically promotes the result to float (7.0).',
        'Use float("3.14") to parse decimal strings and round(4.9) when you want mathematical rounding instead of int() truncation.',
      ],
      examQuestions: [
        {
          q: 'What does print(type(10.0)) output?',
          answer: "<class 'float'>",
          note: 'The presence of .0 makes Python classify it as float, not int.',
        },
        {
          q: 'What is the data type of 10 / 2 in Python 3?',
          answer: "<class 'float'> (value 5.0)",
          note: 'True division / always returns float.',
        },
        {
          q: 'What is the type of 5 + 2.0?',
          answer: "<class 'float'> (value 7.0)",
          note: 'Arithmetic between int and float promotes the result to float.',
        },
        {
          q: 'What does round(4.9) vs int(4.9) return?',
          answer: 'round(4.9) -> 5 | int(4.9) -> 4',
          note: 'round() rounds to nearest integer; int() truncates toward zero.',
        },
      ],
      stages: [
        {
          id: 't-float-1',
          title: 'Scene 1: The Decimal Dot Changes Type',
          narration:
            'Even when a number ends in .0, that single decimal point instructs Python to store it inside a floating-point container (<class "float">).',
          spokenScript:
            'Floating point numbers represent decimals. Compare ten and ten point zero. Even though their mathematical value is equal, the decimal dot makes ten point zero a float, just like three point one four and scientific one point five e two.',
          codeLine: 'a = 10 (int) | b = 10.0 (float) | c = 1.5e2 (150.0)',
          animationKind: 'type-box',
          actionBadge: 'Decimal detected -> float',
          items: [
            { id: 'f1', label: '10', tag: 'int', dimmed: true, stateLabel: 'No decimal' },
            { id: 'f2', label: '10.0', tag: 'float', highlight: true, stateLabel: 'Has .0' },
            { id: 'f3', label: '3.14', tag: 'float', highlight: true, stateLabel: 'Decimal' },
            { id: 'f4', label: '1.5e2', tag: 'float', stateLabel: '150.0' },
          ],
        },
        {
          id: 't-float-2',
          title: 'Scene 2: Division / & Mixed-Type Promotion',
          narration:
            'In Python 3, single-slash division (10 / 2) always returns 5.0 (float), and adding an int with a float (5 + 2.0) upgrades the answer to float (7.0).',
          spokenScript:
            'Two big rules to remember for quizzes: first, single slash division ten divided by two always returns float five point zero. Second, combining an integer and a float like five plus two point zero promotes the result to float seven point zero.',
          codeLine: '10 / 2 -> 5.0 (float)  |  5 + 2.0 -> 7.0 (float)',
          animationKind: 'jump-in',
          actionBadge: 'Promoted to float',
          returnedValue: '5.0 / 7.0',
          items: [
            { id: 'f5', label: '10 / 2', tag: 'inputs: int', stateLabel: 'True division' },
            { id: 'f6', label: '5.0', tag: 'float', added: true, highlight: true, stateLabel: 'Always float' },
            { id: 'f7', label: '5 + 2.0 -> 7.0', tag: 'float', added: true, stateLabel: 'Auto-promoted' },
          ],
        },
        {
          id: 't-float-3',
          title: 'Scene 3: Complex Numbers (2 + 3j) & float() Casting',
          narration:
            'Python also supports complex numbers using j for the imaginary part (type(2 + 3j) is complex), while float("8") converts text or ints into decimals.',
          spokenScript:
            'Do not confuse floats with complex numbers. Adding j like two plus three j creates a complex number, not a float. And calling float on string eight gives eight point zero. Pause for your checkpoint.',
          codeLine: 'z = 2 + 3j   # complex | float("8") -> 8.0',
          animationKind: 'type-box',
          actionBadge: 'float vs complex',
          items: [
            { id: 'f8', label: 'float("8") -> 8.0', tag: 'float', highlight: true, stateLabel: 'Casted' },
            { id: 'f9', label: '2 + 3j', tag: 'complex', stateLabel: 'Uses j' },
          ],
          checkpoint: {
            question: 'What is the data type of the result of 10 / 2 in Python 3?',
            options: ["<class 'int'>", "<class 'float'>", "<class 'complex'>", "<class 'str'>"],
            correctIndex: 1,
            explanation: 'Single-slash division (/) in Python 3 always produces a float (5.0).',
          },
        },
      ],
    },
    {
      id: 'type-str',
      topic: 'types',
      shortLabel: 'str',
      title: 'Strings (str)',
      subtitle: 'Quoted text, immutability, indexing, look-alike traps ("True", "42"), and "".',
      detailedConcepts: [
        'Any characters wrapped in single (\'...\'), double ("..."), or triple quotes belong to <class "str">.',
        'Strings are immutable sequences: you can index word[0] or slice word[1:4], but word[0] = "J" raises TypeError.',
        'Quotes override appearance: "42" and \'False\' are strings (str), NOT int or bool.',
        'An empty string "" has length 0 and is falsy (bool("") == False), while "False" has length 5 and is truthy!',
        'You cannot add a string and integer directly ("Age: " + 20 fails); convert first with str(20) or int("20").',
      ],
      examQuestions: [
        {
          q: "What does type('Hello') and type('False') return?",
          answer: "<class 'str'> for both",
          note: 'Anything enclosed in quotes is stored as text (str).',
        },
        {
          q: 'What does bool("") vs bool("False") evaluate to?',
          answer: 'False vs True',
          note: 'Only an empty string "" is falsy; any non-empty string (even "False") is True.',
        },
        {
          q: 'Can you change a single character in s = "cat" via s[0] = "b"?',
          answer: 'No — raises TypeError',
          note: 'Strings are immutable in Python; create a new string instead.',
        },
        {
          q: 'What happens if you run "5" + 5?',
          answer: 'TypeError (use int("5") + 5 or "5" + str(5))',
          note: 'Python does not auto-convert strings to numbers during +.',
        },
      ],
      stages: [
        {
          id: 't-str-1',
          title: 'Scene 1: Characters Jump Into an Immutable str',
          narration:
            'Wrapping characters in single or double quotes builds an ordered str sequence where each character gets a zero-based index (0 to 5), though characters cannot be mutated in place.',
          spokenScript:
            'Strings store text characters inside quotes. Watch the letters P, y, t, h, o, n jump into the string sequence at indices zero through five. Remember strings are immutable, so you can read index zero, but you cannot overwrite it directly.',
          codeLine: "word = 'Python'   # word[0] == 'P', immutable",
          animationKind: 'jump-in',
          actionBadge: 'Ordered & Immutable str',
          items: [
            { id: 's1', label: "'P'", tag: 'idx 0', added: true },
            { id: 's2', label: "'y'", tag: 'idx 1', added: true },
            { id: 's3', label: "'t'", tag: 'idx 2', added: true },
            { id: 's4', label: "'h'", tag: 'idx 3', added: true },
            { id: 's5', label: "'o'", tag: 'idx 4', added: true },
            { id: 's6', label: "'n'", tag: 'idx 5', added: true },
          ],
        },
        {
          id: 't-str-2',
          title: 'Scene 2: Quotes Override Look-Alike Numbers & Booleans',
          narration:
            'Quotation marks turn digits like "42" and keywords like "True" or \'False\' into plain text strings—never int or bool—until explicitly cast with int() or float().',
          spokenScript:
            'Watch out for quote traps in quizzes. Quoted forty two is a string, not an integer. Quoted True and quoted False are also strings, not booleans. To do math on quoted forty two, you must cast it with int.',
          codeLine: 'a = "42" (str) | b = \'False\' (str) | int(a) -> 42 (int)',
          animationKind: 'type-box',
          actionBadge: 'Quotes -> always str',
          items: [
            { id: 's7', label: '"42"', tag: 'str', dimmed: true, stateLabel: 'Text digits' },
            { id: 's8', label: "'False'", tag: 'str', highlight: true, stateLabel: 'Quoted text!' },
            { id: 's9', label: 'int("42") -> 42', tag: 'int', highlight: true, stateLabel: 'Cast for math' },
          ],
        },
        {
          id: 't-str-3',
          title: 'Scene 3: Empty String "" vs Non-Empty String',
          narration:
            'An empty string "" has length 0 and evaluates to False under bool(""), whereas any non-empty string—even "False" or "0"—evaluates to True!',
          spokenScript:
            'One classic trick question asks for bool of empty quotes versus bool of quoted False. An empty string has zero characters so it fades to False. Quoted False has five characters so it stays True. Solve this checkpoint.',
          codeLine: 'bool("") -> False  |  bool("False") -> True',
          animationKind: 'pop-fade',
          actionBadge: 'Empty "" fades to False',
          returnedValue: 'False',
          items: [
            { id: 's10', label: '"False"', tag: 'len=5 (True)', highlight: true, stateLabel: 'Non-empty!' },
            { id: 's11', label: '""', tag: 'len=0 (False)', removed: true, stateLabel: 'Empty fades' },
          ],
          checkpoint: {
            question: "What does print(type('False'), bool('False')) output?",
            options: [
              "<class 'bool'> False",
              "<class 'str'> True",
              "<class 'str'> False",
              "<class 'bool'> True",
            ],
            correctIndex: 1,
            explanation: "'False' in quotes is a non-empty string (<class 'str'>), and every non-empty string is truthy (True).",
          },
        },
      ],
    },
    {
      id: 'type-bool',
      topic: 'types',
      shortLabel: 'bool',
      title: 'Booleans (bool)',
      subtitle: 'Capitalized True/False, comparisons, truthy vs falsy values, and bool() rules.',
      detailedConcepts: [
        'Python has exactly two Boolean literals: True and False (capitalized first letter, no quotes).',
        'Writing true or false in lowercase causes NameError because Python treats them as undefined variable names.',
        'Comparison expressions (10 > 3, a == b, "py" in "python") always return a bool.',
        'Falsy values in Python: False, None, 0, 0.0, "", [], (), {}, set(). Everything else is truthy!',
        'Boolean values inherit from int under the hood: True + True equals 2 and False == 0.',
      ],
      examQuestions: [
        {
          q: "Which is a valid Boolean literal: 'True', 1, True, or true?",
          answer: 'True',
          note: 'Only unquoted, capitalized True and False have type bool.',
        },
        {
          q: 'What does bool("") and bool(0) return?',
          answer: 'False for both',
          note: 'Empty strings, empty collections, 0, and None are falsy.',
        },
        {
          q: 'What does bool("False") or bool([0]) return?',
          answer: 'True',
          note: 'Both are non-empty containers/strings (even if they hold "False" or 0).',
        },
        {
          q: 'What happens if you write flag = true (lowercase)?',
          answer: 'NameError',
          note: 'Boolean keywords in Python must start with uppercase T or F.',
        },
      ],
      stages: [
        {
          id: 't-bool-1',
          title: 'Scene 1: Capitalized True & False Logic Switch',
          narration:
            'Booleans use capitalized True and False without quotes. Wrapping them in quotes makes them strings, and lowercase true causes a NameError.',
          spokenScript:
            'Booleans act like logical on and off switches. Notice True and False start with capital letters and have no quotes. Lowercase true fails with a NameError, and quoted True is just text.',
          codeLine: 'is_valid = True (bool) | text = "True" (str)',
          animationKind: 'bool-toggle',
          actionBadge: 'Capitalized True / False',
          items: [
            { id: 'b1', label: 'True', tag: 'bool', highlight: true, stateLabel: 'Valid ON' },
            { id: 'b2', label: 'False', tag: 'bool', stateLabel: 'Valid OFF' },
            { id: 'b3', label: "'True'", tag: 'str', dimmed: true, stateLabel: 'Trap: quoted' },
          ],
        },
        {
          id: 't-bool-2',
          title: 'Scene 2: Comparisons Produce Booleans',
          narration:
            'Relational checks like 10 > 3 or 5 == 9 and membership checks like "a" in "cat" evaluate dynamically into True or False.',
          spokenScript:
            'Whenever you compare numbers or check membership with in, Python outputs a boolean. Ten greater than three produces True, while five equals nine produces False.',
          codeLine: '10 > 3 -> True  |  5 == 9 -> False',
          animationKind: 'jump-in',
          actionBadge: 'Comparisons -> bool',
          returnedValue: 'True / False',
          items: [
            { id: 'b4', label: '10 > 3', tag: 'expr', stateLabel: 'Evaluates' },
            { id: 'b5', label: 'True', tag: 'bool', added: true, highlight: true, stateLabel: 'Result' },
            { id: 'b6', label: 'False', tag: 'bool', added: true, stateLabel: '5 == 9' },
          ],
        },
        {
          id: 't-bool-3',
          title: 'Scene 3: Truthiness — Empty Values Fade to False',
          narration:
            'Every Python object has a truth value: 0, "", [], and {} fade to False, whereas non-empty values like "False" or [0] evaluate to True.',
          spokenScript:
            'Know your falsy values: zero, empty string, empty list, and empty dict all fade to False. Any non-empty list like bracket zero or non-empty string like quoted False evaluates to True. Answer the checkpoint.',
          codeLine: 'bool(0) -> False | bool("") -> False | bool("False") -> True',
          animationKind: 'pop-fade',
          actionBadge: '0, "", [] fade to False',
          returnedValue: 'False',
          items: [
            { id: 'b7', label: 'bool("False")', tag: 'True', highlight: true, stateLabel: 'Non-empty' },
            { id: 'b8', label: 'bool([0])', tag: 'True', highlight: true, stateLabel: 'Has 1 item' },
            { id: 'b9', label: 'bool("") / bool(0)', tag: 'False', removed: true, stateLabel: 'Empty/zero fades' },
          ],
          checkpoint: {
            question: 'Which of these evaluates to False when passed to bool()?',
            options: ['"False"', '[0]', '""', '-1'],
            correctIndex: 2,
            explanation: 'Only the empty string "" is falsy here. "False" (non-empty str), [0] (1-item list), and -1 (non-zero int) are all True.',
          },
        },
      ],
    },
    {
      id: 'type-collections',
      topic: 'types',
      shortLabel: 'tuple / set / dict',
      title: 'Collections (tuple, set, dict)',
      subtitle: 'Immutable tuples, unique sets, {} vs set(), and key-value dictionaries.',
      detailedConcepts: [
        'tuple (1, 2): Ordered and IMMUTABLE—cannot add, remove, or overwrite elements after creation.',
        'Single-element tuple trap: (5) is an int, whereas (5,) with a trailing comma is a tuple!',
        'set {1, 2, 3}: Unordered collection of UNIQUE items—duplicates are dropped automatically.',
        'Empty {} trap: empty = {} creates an empty DICTIONARY (dict), NOT a set! Always use set() for an empty set.',
        'dict {"key": value}: Maps unique immutable keys to values for fast O(1) lookup.',
      ],
      examQuestions: [
        {
          q: 'Which built-in collection is immutable: list, tuple, set, or dict?',
          answer: 'tuple',
          note: 'Lists, sets, and dicts are mutable; tuples lock their items after creation.',
        },
        {
          q: 'What does s = {10, 20, 20, 30} store?',
          answer: '{10, 20, 30}',
          note: 'Sets automatically remove duplicate values.',
        },
        {
          q: 'What is type({}) in Python, and how do you make an empty set?',
          answer: "<class 'dict'>; use set() for an empty set",
          note: 'Empty curly braces {} default to a dictionary.',
        },
        {
          q: 'Which data type stores key-value pairs?',
          answer: 'dict (dictionary)',
          note: 'Created with {key: value} syntax.',
        },
      ],
      stages: [
        {
          id: 't-col-1',
          title: 'Scene 1: Tuple Lock (Immutable & Single-Item Comma)',
          narration:
            'Tuples use parentheses () and lock their elements in memory so they cannot be changed in place. Remember: a 1-item tuple requires a trailing comma like (5,).',
          spokenScript:
            'Tuples use round parentheses and lock their items so they are immutable. Watch out for a famous exam question: parentheses around five alone is just an integer. You need a trailing comma like five comma to make a one-element tuple.',
          codeLine: 'coords = (10, 20)  # tuple | single = (5,) # trailing comma!',
          animationKind: 'tuple-lock',
          actionBadge: 'Locked (Immutable)',
          items: [
            { id: 'c1', label: '10', tag: 'idx 0', stateLabel: 'Locked' },
            { id: 'c2', label: '20', tag: 'idx 1', stateLabel: 'Locked' },
            { id: 'c3', label: '(5,)', tag: 'tuple', highlight: true, stateLabel: 'Needs comma!' },
          ],
        },
        {
          id: 't-col-2',
          title: 'Scene 2: Set Deduplication & {} vs set() Trap',
          narration:
            'Sets use curly braces {} to keep only unique elements—duplicates fade away. Crucially, empty {} creates a dict, so you must call set() for an empty set!',
          spokenScript:
            'When ten, twenty, twenty, thirty enter a set, the extra twenty fades away leaving only unique items. And remember: empty curly braces alone create a dictionary, not a set. Use set parentheses to create an empty set.',
          codeLine: '{10, 20, 20, 30} -> {10, 20, 30} | {} -> dict, set() -> set',
          animationKind: 'set-dedup',
          actionBadge: 'Duplicate 20 removed',
          items: [
            { id: 's1', label: '10', tag: 'set', stateLabel: 'Kept' },
            { id: 's2', label: '20', tag: 'set', highlight: true, stateLabel: 'Kept' },
            { id: 's3', label: '20', tag: 'duplicate', duplicate: true, stateLabel: 'Fades out' },
            { id: 's4', label: '30', tag: 'set', stateLabel: 'Kept' },
          ],
        },
        {
          id: 't-col-3',
          title: 'Scene 3: Dictionary Key -> Value Lookup Pairs',
          narration:
            'Dictionaries pair unique keys to values with colons {key: value}, letting you retrieve user["name"] directly in constant time.',
          spokenScript:
            'Dictionaries store key-value pairs using colons inside curly braces, such as name pointing to Ada and score pointing to ninety eight. Answer this final checkpoint.',
          codeLine: 'user = {"name": "Ada", "score": 98} | user["name"] -> "Ada"',
          animationKind: 'dict-pair',
          actionBadge: 'Key -> Value Map',
          items: [
            { id: 'd1', label: '"name"', tag: 'key', pairValue: '"Ada"', highlight: true },
            { id: 'd2', label: '"score"', tag: 'key', pairValue: '98', highlight: true },
          ],
          checkpoint: {
            question: 'What is the output of print(type({}), type(set()))?',
            options: [
              "<class 'set'> <class 'set'>",
              "<class 'dict'> <class 'set'>",
              "<class 'tuple'> <class 'dict'>",
              "<class 'dict'> <class 'list'>",
            ],
            correctIndex: 1,
            explanation: '{} creates an empty dictionary (dict), while set() creates an empty set.',
          },
        },
      ],
    },
  ],
  lists: [
    {
      id: 'list-create',
      topic: 'lists',
      shortLabel: '[] & append()',
      title: 'Empty List & append()',
      subtitle: 'Empty list [], items jumping in via append(), + concatenation, and nested len().',
      detailedConcepts: [
        'Square brackets [] create an ordered, mutable list—empty [] has length 0 (len([]) == 0).',
        'append(x) adds ONE item to the end of the list in place and returns None (never do x = x.append(1)!).',
        'extend([3, 4]) or + concatenation ([1, 2] + [3, 4]) merges items into [1, 2, 3, 4], whereas append([3, 4]) nests the list as one item!',
        'Lists can hold mixed types and even nested lists: len([[1, 2], [3, 4, 5]]) returns 2 (two inner lists).',
      ],
      examQuestions: [
        {
          q: 'Which brackets create a Python list?',
          answer: 'Square brackets []',
          note: '() makes tuples, {} makes dicts/sets, [] makes lists.',
        },
        {
          q: 'What is the output of [1, 2] + [3, 4]?',
          answer: '[1, 2, 3, 4]',
          note: 'The + operator concatenates two lists into a single flat list.',
        },
        {
          q: 'What does len([[1, 2], [3, 4, 5]]) return?',
          answer: '2',
          note: 'len() counts top-level elements in the outer list (2 inner lists).',
        },
        {
          q: 'What does nums = nums.append(10) accidentally set nums to?',
          answer: 'None',
          note: 'append() mutates in place and returns None—never assign its return value.',
        },
      ],
      stages: [
        {
          id: 'l-cr-1',
          title: 'Scene 1: Start with an Empty List []',
          narration:
            'Writing nums = [] creates an empty mutable list container with length 0 and no slots yet—ready to grow dynamically with append().',
          spokenScript:
            'Scene one: Every dynamic list often starts empty using square brackets with nothing inside. Right now, len of nums is zero.',
          codeLine: 'nums = []   # len(nums) == 0, mutable container',
          animationKind: 'empty-list',
          actionBadge: 'len(nums) = 0',
          items: [],
        },
        {
          id: 'l-cr-2',
          title: 'Scene 2: Numbers Jump Inside One by One with append()',
          narration:
            'Calling nums.append(10), nums.append(20), and nums.append(30) drops each number sequentially into the tail slot (indices 0, 1, 2) and returns None.',
          spokenScript:
            'Scene two: Watch ten, twenty, and thirty jump inside the empty list one by one as append adds each item to the end. Remember append modifies the list in place and returns None, so never write nums equals nums dot append.',
          codeLine: 'nums.append(10); nums.append(20); nums.append(30)',
          animationKind: 'jump-in',
          actionBadge: 'Appending 10, 20, 30',
          items: [
            { id: 'a1', label: '10', tag: 'idx 0', added: true, stateLabel: 'Jumped in #1' },
            { id: 'a2', label: '20', tag: 'idx 1', added: true, stateLabel: 'Jumped in #2' },
            { id: 'a3', label: '30', tag: 'idx 2', added: true, stateLabel: 'Jumped in #3' },
          ],
        },
        {
          id: 'l-cr-3',
          title: 'Scene 3: + Concatenation vs Nested Lists',
          narration:
            'Joining two lists with + produces [1, 2, 3, 4], whereas nesting a list inside a list counts as 1 element—so len([[1, 2], [3, 4, 5]]) equals 2!',
          spokenScript:
            'Scene three: Using plus concatenates two lists into one combined list. And if a list holds two inner lists, len counts only the two outer items. Solve this checkpoint.',
          codeLine: '[1, 2] + [3, 4] -> [1, 2, 3, 4] | len([[1, 2], [3, 4, 5]]) -> 2',
          animationKind: 'jump-in',
          actionBadge: 'Nested & Concatenated',
          items: [
            { id: 'a4', label: '[1, 2]', tag: 'outer idx 0', added: true, stateLabel: 'len = 2' },
            { id: 'a5', label: '[3, 4, 5]', tag: 'outer idx 1', added: true, highlight: true, stateLabel: 'len = 3' },
          ],
          checkpoint: {
            question: 'What does len([[1, 2], [3, 4, 5]]) return in Python?',
            options: ['5', '2', '3', 'TypeError'],
            correctIndex: 1,
            explanation: 'The outer list contains 2 elements (each element is an inner list), so len() returns 2.',
          },
        },
      ],
    },
    {
      id: 'list-index',
      topic: 'lists',
      shortLabel: 'index() & []',
      title: 'index() & List Indexing',
      subtitle: 'Zero-based [0], negative [-1], .index(val) search, and IndexError/ValueError traps.',
      detailedConcepts: [
        'Python uses zero-based indexing: the first element is always nums[0], and the last is nums[len(nums) - 1] or nums[-1].',
        'Negative indices count backward from the right (-1 is last, -2 is second-to-last).',
        'nums.index(x) scans from index 0 and returns the FIRST index where x appears—it raises ValueError if x is absent.',
        'Accessing an index beyond the list size (e.g., nums[10] on a 4-item list) raises IndexError.',
        'Lists are mutable by index: nums[1] = 99 overwrites the second slot in place.',
      ],
      examQuestions: [
        {
          q: 'What is the index of the first element in any Python list?',
          answer: '0',
          note: 'Python uses zero-based indexing.',
        },
        {
          q: 'What does numbers[-1] and numbers[-2] return for [10, 20, 30, 40]?',
          answer: '40 and 30',
          note: 'Negative indexing starts at -1 for the last element.',
        },
        {
          q: 'What does [10, 20, 30, 20].index(20) return?',
          answer: '1',
          note: 'index() stops at and returns the index of the FIRST match.',
        },
        {
          q: 'What error is raised by nums.index(99) if 99 is not in nums?',
          answer: 'ValueError',
          note: 'Check with `if 99 in nums:` before calling .index(99).',
        },
      ],
      stages: [
        {
          id: 'l-idx-1',
          title: 'Scene 1: Scanning Left-to-Right with .index(30)',
          narration:
            'Calling nums.index(30) scans slot 0, then slot 1, then locks onto 30 at slot 2 and returns 2. If there are duplicate 30s, it returns the first index; if missing, it raises ValueError.',
          spokenScript:
            'Using dot index on a list. When you call numbers dot index thirty, Python scans left to right from index zero, skips ten and twenty, finds thirty at index two, and returns two.',
          codeLine: 'pos = nums.index(30)   # returns 2 (first match)',
          animationKind: 'index-scan',
          actionBadge: 'Scanning for 30 -> idx 2',
          returnedValue: '2',
          items: [
            { id: 'x0', label: '10', tag: 'idx 0 / -4' },
            { id: 'x1', label: '20', tag: 'idx 1 / -3' },
            { id: 'x2', label: '30', tag: 'idx 2 / -2', scanTarget: true, highlight: true, stateLabel: 'Found @ 2' },
            { id: 'x3', label: '40', tag: 'idx 3 / -1' },
          ],
        },
        {
          id: 'l-idx-2',
          title: 'Scene 2: Negative Indexing from the End (nums[-1], nums[-2])',
          narration:
            'Negative indices let you read backward without calling len(): -1 always targets the last element (40), and -2 steps one slot left to 30.',
          spokenScript:
            'Negative indexing reads backward from the right. Minus one is always the last element, forty, and minus two steps one slot left to thirty.',
          codeLine: 'nums[-1] -> 40  |  nums[-2] -> 30',
          animationKind: 'index-scan',
          actionBadge: 'nums[-2] -> 30',
          returnedValue: '30',
          items: [
            { id: 'x0', label: '10', tag: 'idx 0 / -4', dimmed: true },
            { id: 'x1', label: '20', tag: 'idx 1 / -3', dimmed: true },
            { id: 'x2', label: '30', tag: 'idx 2 / -2', scanTarget: true, highlight: true, stateLabel: 'nums[-2]' },
            { id: 'x3', label: '40', tag: 'idx 3 / -1', dimmed: true },
          ],
        },
        {
          id: 'l-idx-3',
          title: 'Scene 3: Mutating by Index & Out-of-Range Error',
          narration:
            'Because lists are mutable, assigning nums[1] = 99 replaces 20 directly in place—whereas reading nums[9] raises IndexError.',
          spokenScript:
            'Because lists are mutable, you can overwrite any valid slot like numbers one equals ninety nine. Just avoid accessing an index beyond the list length, which raises IndexError. Answer the checkpoint.',
          codeLine: 'nums[1] = 99 -> [10, 99, 30, 40]  |  nums[9] -> IndexError',
          animationKind: 'jump-in',
          actionBadge: 'In-place update @ idx 1',
          items: [
            { id: 'm0', label: '10', tag: 'idx 0' },
            { id: 'm1', label: '99', tag: 'idx 1', added: true, highlight: true, stateLabel: 'Overwritten!' },
            { id: 'm2', label: '30', tag: 'idx 2' },
            { id: 'm3', label: '40', tag: 'idx 3' },
          ],
          checkpoint: {
            question: 'For nums = [10, 20, 30, 20], what does nums.index(20) return?',
            options: ['3', '1', '[1, 3]', '20'],
            correctIndex: 1,
            explanation: 'index() returns the first zero-based index where 20 appears, which is 1.',
          },
        },
      ],
    },
    {
      id: 'list-pop',
      topic: 'lists',
      shortLabel: 'pop()',
      title: 'Using pop() on Lists',
      subtitle: 'Fade out & return last element with pop(), indexed pop(i), and stack LIFO behavior.',
      detailedConcepts: [
        'nums.pop() with NO arguments removes the LAST element and RETURNS that removed value.',
        'nums.pop(i) removes the element at index i (e.g., pop(0) removes the first item), shifts later items left, and returns it.',
        'Key exam difference: pop() RETURNS the removed item, whereas remove() returns None and del returns nothing.',
        'Calling pop() on an empty list [] raises IndexError: pop from empty list.',
      ],
      examQuestions: [
        {
          q: 'What does numbers.pop() return?',
          answer: 'The removed last item',
          note: 'Unlike remove(), pop() gives back the element it removed.',
        },
        {
          q: 'Given x = [5, 10, 15], after val = x.pop(), what are val and x?',
          answer: 'val = 15, x = [5, 10]',
          note: 'pop() removes 15 from the tail and returns it to val.',
        },
        {
          q: 'How do you pop the first element of a list?',
          answer: 'nums.pop(0)',
          note: 'Passing index 0 removes and returns the first element.',
        },
        {
          q: 'What happens if you call [].pop()?',
          answer: 'IndexError',
          note: 'You cannot pop from an empty list.',
        },
      ],
      stages: [
        {
          id: 'l-pop-1',
          title: 'Scene 1: pop() Fades & Returns the Last Number',
          narration:
            'Calling last = nums.pop() highlights the last element (40), fades it out of the list, and hands 40 back as its return value—leaving [10, 20, 30].',
          spokenScript:
            'Pop with empty parentheses always targets the very last number. Watch forty lift up and fade out of the list, leaving ten, twenty, thirty while returning forty to your variable.',
          codeLine: 'last = nums.pop()   # last=40, nums=[10, 20, 30]',
          animationKind: 'pop-fade',
          actionBadge: 'Last item 40 fades out',
          returnedValue: '40',
          items: [
            { id: 'p0', label: '10', tag: 'idx 0' },
            { id: 'p1', label: '20', tag: 'idx 1' },
            { id: 'p2', label: '30', tag: 'idx 2' },
            { id: 'p3', label: '40', tag: 'idx 3', removed: true, highlight: true, stateLabel: 'Popped!' },
          ],
        },
        {
          id: 'l-pop-2',
          title: 'Scene 2: pop(0) Pops Index 0 & Shifts Remaining Left',
          narration:
            'Passing an index like nums.pop(0) fades out index 0 (10), returns 10, and slides remaining elements left so 20 becomes index 0.',
          spokenScript:
            'Passing an index like pop zero removes the item at position zero. Ten fades out and is returned, while twenty and thirty shift left to indices zero and one.',
          codeLine: 'first = nums.pop(0)   # first=10, nums=[20, 30]',
          animationKind: 'pop-fade',
          actionBadge: 'Index 0 (10) popped',
          returnedValue: '10',
          items: [
            { id: 'p0', label: '10', tag: 'idx 0', removed: true, highlight: true, stateLabel: 'Popped!' },
            { id: 'p1', label: '20', tag: 'now idx 0', stateLabel: 'Shifted left' },
            { id: 'p2', label: '30', tag: 'now idx 1', stateLabel: 'Shifted left' },
          ],
        },
        {
          id: 'l-pop-3',
          title: 'Scene 3: Negative pop(-2) & Empty List Guard',
          narration:
            'pop() even accepts negative indices like pop(-2), and remember: popping from an empty list [] raises IndexError!',
          spokenScript:
            'You can also pass negative indices like pop minus two, and remember popping an empty list raises IndexError. Complete this checkpoint.',
          codeLine: 'nums.pop(-2)   # removes 2nd from end | [].pop() -> IndexError',
          animationKind: 'pop-fade',
          actionBadge: 'Returned item captured',
          returnedValue: '20',
          items: [
            { id: 'p4', label: '10', tag: 'idx 0' },
            { id: 'p5', label: '20', tag: 'idx -2', removed: true, highlight: true, stateLabel: 'Popped!' },
            { id: 'p6', label: '30', tag: 'idx -1' },
          ],
          checkpoint: {
            question: 'Given x = [5, 10, 15], after val = x.pop(), what are val and x?',
            options: [
              'val = 5, x = [10, 15]',
              'val = 15, x = [5, 10]',
              'val = None, x = [5, 10]',
              'val = 15, x = [5, 10, 15]',
            ],
            correctIndex: 1,
            explanation: 'pop() removes the last item (15) from x AND returns 15 to val.',
          },
        },
      ],
    },
    {
      id: 'list-delete',
      topic: 'lists',
      shortLabel: 'del & remove()',
      title: 'Deleting with del & remove()',
      subtitle: 'del by index or slice vs remove(value) deleting first match and returning None.',
      detailedConcepts: [
        'del nums[1] deletes by INDEX (even slices like del nums[1:3]) and returns nothing.',
        'nums.remove(20) searches by VALUE and deletes ONLY the FIRST matching 20, returning None.',
        'If you call nums.remove(99) when 99 is not in the list, Python raises ValueError.',
        'Summary rule: know the value -> remove(val); know the index and want nothing back -> del nums[i]; know the index and want the value back -> pop(i).',
      ],
      examQuestions: [
        {
          q: 'What does numbers.remove(20) do on [10, 20, 30, 20]?',
          answer: 'Removes only the first 20 -> [10, 30, 20]',
          note: 'remove(x) removes the first occurrence of value x, not index x.',
        },
        {
          q: 'What is the return value of nums.remove(20)?',
          answer: 'None',
          note: 'Unlike pop(), remove() mutates in place and returns None.',
        },
        {
          q: 'How do you delete an item by index without returning it?',
          answer: 'del nums[index]',
          note: 'del can also delete slices like del nums[0:2] or clear a list with .clear().',
        },
        {
          q: 'What happens if remove(x) cannot find x in the list?',
          answer: 'Raises ValueError',
          note: 'Check `if x in nums:` before calling remove(x).',
        },
      ],
      stages: [
        {
          id: 'l-del-1',
          title: 'Scene 1: del nums[1] Deletes by Index',
          narration:
            'The del statement targets an exact index (or slice like del nums[1:3]). Running del nums[1] fades out index 1 (20) and closes the gap without returning a value.',
          spokenScript:
            'Delete by index using the del keyword. Running del numbers one deletes the element at position one, which is twenty, and slides later items left without returning anything.',
          codeLine: 'del nums[1]   # deletes index 1 (also supports del nums[0:2])',
          animationKind: 'delete-fade',
          actionBadge: 'del nums[1] removes 20',
          returnedValue: 'No return value',
          items: [
            { id: 'd0', label: '10', tag: 'idx 0' },
            { id: 'd1', label: '20', tag: 'idx 1', removed: true, highlight: true, stateLabel: 'Deleted' },
            { id: 'd2', label: '30', tag: 'now idx 1', stateLabel: 'Shifts left' },
            { id: 'd3', label: '20', tag: 'now idx 2', stateLabel: 'Shifts left' },
          ],
        },
        {
          id: 'l-del-2',
          title: 'Scene 2: remove(20) Deletes First Matching Value',
          narration:
            'Unlike del or pop, nums.remove(20) takes a VALUE, deletes only the FIRST matching 20, keeps the second 20, and returns None.',
          spokenScript:
            'Remove takes a value instead of an index. On ten, twenty, thirty, twenty, calling remove twenty fades out only the first twenty and leaves the second twenty intact, returning None.',
          codeLine: 'nums.remove(20)   # [10, 30, 20], returns None',
          animationKind: 'delete-fade',
          actionBadge: 'First value 20 faded',
          returnedValue: 'Returns None',
          items: [
            { id: 'r0', label: '10', tag: 'idx 0' },
            { id: 'r1', label: '20', tag: 'match #1', removed: true, highlight: true, stateLabel: 'Removed' },
            { id: 'r2', label: '30', tag: 'now idx 1' },
            { id: 'r3', label: '20', tag: 'now idx 2', stateLabel: '2nd 20 kept!' },
          ],
        },
        {
          id: 'l-del-3',
          title: 'Scene 3: Comparing del vs remove() vs pop()',
          narration:
            'Remember the three-way rule: del uses index (no return), pop() uses index (returns removed item), and remove() uses value (returns None, ValueError if missing).',
          spokenScript:
            'Keep all three deletion tools straight: del deletes by index, pop deletes by index and returns the item, and remove deletes the first matching value. Solve this checkpoint.',
          codeLine: 'del a[i] (index) | a.pop(i) (index+return) | a.remove(v) (value)',
          animationKind: 'type-box',
          actionBadge: '3 Ways to Delete',
          items: [
            { id: 'c1', label: 'del a[1]', tag: 'by index', stateLabel: 'No return' },
            { id: 'c2', label: 'a.pop(1)', tag: 'by index', highlight: true, stateLabel: 'Returns item' },
            { id: 'c3', label: 'a.remove(20)', tag: 'by value', stateLabel: 'Returns None' },
          ],
          checkpoint: {
            question: 'What does numbers.remove(20) do on numbers = [10, 20, 30, 20]?',
            options: [
              'Removes the item at index 20',
              'Removes both 20s from the list',
              'Removes only the first 20, leaving [10, 30, 20]',
              'Returns 20 and leaves the list unchanged',
            ],
            correctIndex: 2,
            explanation: 'remove(20) deletes only the first occurrence of value 20 and returns None.',
          },
        },
      ],
    },
    {
      id: 'list-insert-slice',
      topic: 'lists',
      shortLabel: 'insert(), Slice & copy()',
      title: 'insert(), Slicing [1:3] & copy()',
      subtitle: 'Shifting with insert(), slice bounds [start:stop:step], [::-1], and aliasing vs copy().',
      detailedConcepts: [
        'insert(i, x) places x at index i and shifts elements from index i onward one slot to the right.',
        'Slicing list[start:stop] includes start and EXCLUDES stop—so nums[1:3] returns [nums[1], nums[2]] as a brand-new list.',
        'Step slicing nums[::-1] walks backward with step -1 to create a reversed copy without modifying nums.',
        'Aliasing trap: b = a makes BOTH variables point to the same list object in memory, so b.append(99) mutates a too!',
        'Safe duplication: use b = a.copy() or b = a[:] to allocate an independent list object.',
      ],
      examQuestions: [
        {
          q: 'Which indices does nums[1:3] include?',
          answer: 'Index 1 and index 2 (stop index 3 is excluded)',
          note: 'Start is inclusive, stop is exclusive.',
        },
        {
          q: 'How do you reverse a list using slicing?',
          answer: 'nums[::-1]',
          note: 'Setting step to -1 traverses backward and returns a new reversed list.',
        },
        {
          q: 'If b = a.copy() and you run b.append(99), does a change?',
          answer: 'No — a stays unchanged',
          note: 'Without .copy() (just b = a), modifying b would also mutate a.',
        },
        {
          q: 'How many elements are in nums[0:3] for a 4-item list?',
          answer: '3 elements (indices 0, 1, 2)',
          note: 'Count is stop - start = 3 - 0 = 3.',
        },
      ],
      stages: [
        {
          id: 'l-ins-1',
          title: 'Scene 1: insert(1, 15) Drops In & Shifts Right',
          narration:
            'Calling nums.insert(1, 15) shifts elements from index 1 onward one position right and drops 15 into index 1.',
          spokenScript:
            'Insert lets you add an item at any chosen index. Watch fifteen drop into slot one while twenty, thirty, and forty shift one step to the right.',
          codeLine: 'nums.insert(1, 15)   # [10, 15, 20, 30, 40]',
          animationKind: 'insert-shift',
          actionBadge: 'Inserted 15 @ idx 1',
          items: [
            { id: 'in0', label: '10', tag: 'idx 0' },
            { id: 'in1', label: '15', tag: 'idx 1', added: true, highlight: true, stateLabel: 'Inserted' },
            { id: 'in2', label: '20', tag: 'idx 2', stateLabel: 'Shifted ->' },
            { id: 'in3', label: '30', tag: 'idx 3', stateLabel: 'Shifted ->' },
            { id: 'in4', label: '40', tag: 'idx 4', stateLabel: 'Shifted ->' },
          ],
        },
        {
          id: 'l-ins-2',
          title: 'Scene 2: Sliding the Slice Window [1:3] & Reverse [::-1]',
          narration:
            'Slicing nums[1:3] includes index 1 and stops right before index 3 -> [20, 30]. Adding step -1 (nums[::-1]) returns a reversed copy.',
          spokenScript:
            'In slicing, the start index enters the window and the stop index stays outside. So one colon three grabs indices one and two. And nums colon colon minus one builds a reversed copy.',
          codeLine: 'nums[1:3] -> [20, 30]  |  nums[::-1] -> [40, 30, 20, 10]',
          animationKind: 'slice-window',
          actionBadge: 'Slice Window [1:3]',
          returnedValue: '[20, 30]',
          items: [
            { id: 'sl0', label: '10', tag: 'idx 0', dimmed: true, stateLabel: 'Outside' },
            { id: 'sl1', label: '20', tag: 'idx 1', highlight: true, stateLabel: 'Included' },
            { id: 'sl2', label: '30', tag: 'idx 2', highlight: true, stateLabel: 'Included' },
            { id: 'sl3', label: '40', tag: 'idx 3', dimmed: true, stateLabel: 'Stop (out)' },
          ],
        },
        {
          id: 'l-ins-3',
          title: 'Scene 3: Aliasing (b = a) vs True Copy (b = a.copy())',
          narration:
            'Writing b = a creates an alias pointing to the SAME list in memory! Always use b = a.copy() or b = a[:] so changes to b never corrupt a.',
          spokenScript:
            'Final critical trap: writing b equals a does not copy the list—both names point to the exact same list! Always use dot copy or slice colon so changing b leaves a safe. Solve the checkpoint.',
          codeLine: 'b = a.copy(); b.append(99)   # a stays unchanged!',
          animationKind: 'type-box',
          actionBadge: 'Independent copy()',
          items: [
            { id: 'cp1', label: 'a = [10, 20]', tag: 'Object #1', stateLabel: 'Unchanged' },
            { id: 'cp2', label: 'b = a.copy()', tag: 'Object #2', highlight: true, stateLabel: 'Independent!' },
          ],
          checkpoint: {
            question: 'If b = a.copy() for a = [10, 20], what happens to a when you run b.append(99)?',
            options: [
              'a also gets 99',
              'a stays unchanged ([10, 20])',
              'Python raises TypeError',
              'a becomes empty',
            ],
            correctIndex: 1,
            explanation: 'a.copy() creates an independent list object in memory, so mutating b does not affect a.',
          },
        },
      ],
    },
  ],
};

export const QUESTION_BANK: Record<TopicId, QuizQuestion[]> = {
  types: [
    {
      id: 'qt-1',
      topic: 'types',
      subtopic: 'Numeric types',
      question: 'Which data type stores whole numbers without a decimal point?',
      options: ['float', 'int', 'str', 'bool'],
      correctIndex: 1,
      explanation: 'int represents whole numbers (positive, negative, or zero) without decimals.',
      supportiveExample: `count = 42\ntemp = -7\nprint(type(count))  # <class 'int'>`,
    },
    {
      id: 'qt-2',
      topic: 'types',
      subtopic: 'Numeric types',
      question: 'What is the data type of 3.14?',
      options: ['int', 'str', 'float', 'bool'],
      correctIndex: 2,
      explanation: 'Numbers containing a decimal point are stored as float values—even 10.0.',
      supportiveExample: `pi = 3.14\nexact = 10.0\nprint(type(pi), type(exact))`,
    },
    {
      id: 'qt-3',
      topic: 'types',
      subtopic: 'Boolean',
      question: 'Which of these is a valid Boolean value in Python?',
      options: ["'True'", '1', 'True', "'False'"],
      correctIndex: 2,
      explanation: 'True (unquoted, capitalized) is a bool. Quoted values are strings and 1 is an int.',
      supportiveExample: `is_valid = True\ntext_flag = 'True'\nprint(type(is_valid), type(text_flag))`,
    },
    {
      id: 'qt-4',
      topic: 'types',
      subtopic: 'Collection types',
      question: 'What is the type of [1, 2, 3]?',
      options: ['tuple', 'set', 'list', 'dict'],
      correctIndex: 2,
      explanation: 'Square brackets [] create a mutable, ordered list.',
      supportiveExample: `items = [1, 2, 3]\nitems.append(4)\nprint(type(items))  # <class 'list'>`,
    },
    {
      id: 'qt-5',
      topic: 'types',
      subtopic: 'Collection types',
      question: 'Which data type stores key-value pairs?',
      options: ['list', 'tuple', 'dict', 'str'],
      correctIndex: 2,
      explanation: 'Dictionaries (dict) map unique keys to values using {key: value} syntax.',
      supportiveExample: `user = {"name": "Ada", "score": 98}\nprint(user["name"], type(user))`,
    },
    {
      id: 'qt-6',
      topic: 'types',
      subtopic: 'Collection types',
      question: 'Which built-in collection type is immutable?',
      options: ['list', 'dict', 'set', 'tuple'],
      correctIndex: 3,
      explanation: 'Tuples cannot be modified in place after creation, making them immutable.',
      supportiveExample: `point = (10, 20)\nprint(type(point))  # <class 'tuple'>`,
    },
    {
      id: 'qt-7',
      topic: 'types',
      subtopic: 'Strings',
      question: "What does type('Hello') return?",
      options: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'bool'>"],
      correctIndex: 1,
      explanation: 'Text wrapped in single or double quotes belongs to the str (string) class.',
      supportiveExample: `greeting = 'Hello'\nprint(type(greeting))  # <class 'str'>`,
    },
    {
      id: 'qt-8',
      topic: 'types',
      subtopic: 'Numeric types',
      question: 'What is the data type of 2 + 3j?',
      options: ['int', 'complex', 'float', 'str'],
      correctIndex: 1,
      explanation: 'Python represents complex numbers using j for the imaginary component.',
      supportiveExample: `z = 2 + 3j\nprint(type(z))  # <class 'complex'>`,
    },
    {
      id: 'qt-9',
      topic: 'types',
      subtopic: 'Collection types',
      question: 'Which collection automatically removes duplicate elements?',
      options: ['list', 'tuple', 'set', 'str'],
      correctIndex: 2,
      explanation: 'Sets only store unique items and discard duplicate entries automatically.',
      supportiveExample: `unique = {10, 20, 20, 30}\nprint(unique)  # {10, 20, 30}`,
    },
    {
      id: 'qt-10',
      topic: 'types',
      subtopic: 'Type conversion',
      question: 'What is the result of int(4.9) in Python?',
      codeSnippet: 'x = int(4.9)\nprint(x)',
      options: ['5', '4', '4.9', 'Error'],
      correctIndex: 1,
      explanation: 'int() truncates toward zero instead of rounding, so int(4.9) evaluates to 4.',
      supportiveExample: `print(int(4.9))    # 4\nprint(round(4.9))  # 5`,
    },
    {
      id: 'qt-11',
      topic: 'types',
      subtopic: 'Strings',
      question: 'What does bool("") evaluate to?',
      options: ['True', 'False', 'None', 'Error'],
      correctIndex: 1,
      explanation: 'An empty string "" has length 0 and is falsy in Python, so bool("") returns False.',
      supportiveExample: `print(bool(""))       # False\nprint(bool("False"))  # True (non-empty!)`,
    },
    {
      id: 'qt-12',
      topic: 'types',
      subtopic: 'Numeric types',
      question: 'What is the data type of the result of 10 / 2 in Python 3?',
      options: ['int', 'float', 'bool', 'complex'],
      correctIndex: 1,
      explanation: 'Single-slash division (/) in Python 3 always returns a float (5.0). Use // for integer division.',
      supportiveExample: `print(10 / 2, type(10 / 2))    # 5.0 <class 'float'>\nprint(10 // 2, type(10 // 2))  # 5 <class 'int'>`,
    },
  ],
  lists: [
    {
      id: 'ql-1',
      topic: 'lists',
      subtopic: 'List creation',
      question: 'Which brackets create a Python list?',
      options: ['()', '{}', '[]', '<>'],
      correctIndex: 2,
      explanation: 'Square brackets [] define a list literal in Python.',
      supportiveExample: `nums = [10, 20, 30]\nprint(nums, type(nums))`,
    },
    {
      id: 'ql-2',
      topic: 'lists',
      subtopic: 'Indexing',
      question: 'What is the index of the first element in a Python list?',
      options: ['1', '0', '-1', '2'],
      correctIndex: 1,
      explanation: 'Python uses zero-based indexing, so the first element is always at index 0.',
      supportiveExample: `colors = ["red", "blue", "green"]\nprint(colors[0])  # red`,
    },
    {
      id: 'ql-3',
      topic: 'lists',
      subtopic: 'Indexing',
      question: 'What does numbers[-1] access?',
      options: ['First element', 'Second element', 'Last element', 'IndexError'],
      correctIndex: 2,
      explanation: 'Negative indexing starts from the end of the list, so -1 always points to the last item.',
      supportiveExample: `numbers = [10, 20, 30, 40]\nprint(numbers[-1])  # 40`,
    },
    {
      id: 'ql-4',
      topic: 'lists',
      subtopic: 'List methods',
      question: 'Which method adds an item to the very end of a list?',
      options: ['insert()', 'append()', 'remove()', 'pop()'],
      correctIndex: 1,
      explanation: 'append(item) adds a single element to the end of the list in place.',
      supportiveExample: `items = [1, 2]\nitems.append(3)\nprint(items)  # [1, 2, 3]`,
    },
    {
      id: 'ql-5',
      topic: 'lists',
      subtopic: 'List methods',
      question: 'What does numbers.remove(20) do?',
      options: [
        'Removes the item at index 20',
        'Removes the first occurrence of value 20',
        'Adds 20 to the end',
        'Sorts the list',
      ],
      correctIndex: 1,
      explanation: 'remove(x) searches for the value x and deletes its first matching occurrence.',
      supportiveExample: `numbers = [10, 20, 30, 20]\nnumbers.remove(20)\nprint(numbers)  # [10, 30, 20]`,
    },
    {
      id: 'ql-6',
      topic: 'lists',
      subtopic: 'Slicing',
      question: 'Which indices does numbers[1:3] include?',
      codeSnippet: 'numbers = [10, 20, 30, 40]\nprint(numbers[1:3])',
      options: ['Index 1 only', 'Index 1 and 2', 'Index 1, 2, and 3', 'Entire list'],
      correctIndex: 1,
      explanation: 'Slicing includes the start index (1) and excludes the stop index (3), returning [20, 30].',
      supportiveExample: `numbers = [10, 20, 30, 40]\nprint(numbers[1:3])  # [20, 30]`,
    },
    {
      id: 'ql-7',
      topic: 'lists',
      subtopic: 'Mutability',
      question: 'Are Python lists mutable?',
      options: ['Yes', 'No', 'Only numeric lists', 'Only empty lists'],
      correctIndex: 0,
      explanation: 'Lists are mutable: you can add, remove, or overwrite elements directly in place.',
      supportiveExample: `scores = [10, 20, 30]\nscores[0] = 99\nprint(scores)  # [99, 20, 30]`,
    },
    {
      id: 'ql-8',
      topic: 'lists',
      subtopic: 'List methods',
      question: 'What does numbers.pop() return?',
      options: ['The removed item', 'The list length', 'Always the first item', 'None'],
      correctIndex: 0,
      explanation: 'pop() removes the element (default: last element) and returns that removed value.',
      supportiveExample: `numbers = [10, 20, 30]\nlast = numbers.pop()\nprint("Popped:", last, "Remaining:", numbers)`,
    },
    {
      id: 'ql-9',
      topic: 'lists',
      subtopic: 'List operations',
      question: 'What is the output of [1, 2] + [3, 4]?',
      options: ['[1, 2]', '[3, 4]', '[1, 2, 3, 4]', 'TypeError'],
      correctIndex: 2,
      explanation: 'The + operator concatenates two lists into a single combined list.',
      supportiveExample: `a = [1, 2]\nb = [3, 4]\nprint(a + b)  # [1, 2, 3, 4]`,
    },
    {
      id: 'ql-10',
      topic: 'lists',
      subtopic: 'List operations',
      question: 'What does len([[1, 2], [3, 4, 5]]) return?',
      options: ['5', '2', '3', 'Error'],
      correctIndex: 1,
      explanation: 'The outer list holds 2 inner list elements, so len() returns 2.',
      supportiveExample: `grid = [[1, 2], [3, 4, 5]]\nprint(len(grid))     # 2\nprint(len(grid[1]))  # 3`,
    },
    {
      id: 'ql-11',
      topic: 'lists',
      subtopic: 'Mutability',
      question: 'If b = a.copy(), what happens to a when you run b.append(99)?',
      options: ['a also gets 99', 'a stays unchanged', 'Python raises TypeError', 'a becomes empty'],
      correctIndex: 1,
      explanation: 'a.copy() creates an independent list object, so changes to b do not affect a.',
      supportiveExample: `a = [10, 20]\nb = a.copy()\nb.append(99)\nprint("a:", a, "b:", b)`,
    },
  ],
};

export const SUBJECTIVE_QUESTIONS: Record<TopicId, SubjectiveQuestion[]> = {
  types: [
    {
      id: 'sub-t-1',
      topic: 'types',
      subtopic: 'Numeric types',
      prompt: 'Explain the difference between single-slash division (/) and floor division (//) in Python 3.',
      mode: 'explanation',
      requiredKeywords: ['float', 'floor'],
      modelAnswer:
        'Single-slash division (/) always returns a float (e.g., 10 / 2 is 5.0), whereas floor division (//) returns the whole-number quotient rounded down (e.g., 7 // 2 is 3).',
      theorySummary:
        'Python 3 separates true decimal division (/) from integer floor division (//) so dividing integers never silently loses remainder precision.',
      supportiveExample: `print(10 / 2)   # 5.0 (float)\nprint(7 // 2)   # 3 (int quotient)`,
    },
    {
      id: 'sub-t-2',
      topic: 'types',
      subtopic: 'Type conversion',
      prompt: 'Write Python code that converts raw = "45" to an integer, adds 5, and prints the result (50).',
      starterCode: 'raw = "45"\n',
      mode: 'code',
      expectedOutput: '50',
      modelAnswer: 'print(int(raw) + 5)',
      theorySummary:
        'Strings holding digits cannot be added directly to integers. Casting with int(raw) turns "45" into an integer before addition.',
      supportiveExample: `raw = "45"\ntotal = int(raw) + 5\nprint(total)  # 50`,
    },
    {
      id: 'sub-t-3',
      topic: 'types',
      subtopic: 'Collection types',
      prompt: 'Why does writing empty = {} create a dictionary instead of a set, and how do you create an empty set?',
      mode: 'explanation',
      requiredKeywords: ['dict', 'set()'],
      modelAnswer:
        'Curly braces {} alone default to an empty dictionary (dict). To create an empty set, you must call set().',
      theorySummary:
        'Both dict and set use curly braces, so Python reserves {} for an empty dictionary and provides the set() constructor for empty sets.',
      supportiveExample: `d = {}\ns = set()\nprint(type(d), type(s))`,
    },
  ],
  lists: [
    {
      id: 'sub-l-1',
      topic: 'lists',
      subtopic: 'List methods',
      prompt: 'Explain the key difference between list.remove() and list.pop().',
      mode: 'explanation',
      requiredKeywords: ['value', 'index'],
      modelAnswer:
        'remove(x) deletes the first occurrence of a matching value and returns None, while pop(i) removes an element by its index (defaulting to the last item) and returns the removed value.',
      theorySummary:
        'Use remove() when you know the value to delete, and pop() when you know the position or need the removed item returned.',
      supportiveExample: `nums = [10, 20, 30]\nnums.remove(20)       # removes value 20\nx = nums.pop(0)       # removes index 0 & returns 10`,
    },
    {
      id: 'sub-l-2',
      topic: 'lists',
      subtopic: 'Slicing',
      prompt: 'Given nums = [10, 20, 30, 40, 50], write Python code to print a reversed copy using slicing.',
      starterCode: 'nums = [10, 20, 30, 40, 50]\n',
      mode: 'code',
      expectedOutput: '[50, 40, 30, 20, 10]',
      modelAnswer: 'print(nums[::-1])',
      theorySummary:
        'Slicing supports a third step parameter list[start:stop:step]. Setting step to -1 walks backward from the end to create a reversed copy.',
      supportiveExample: `nums = [10, 20, 30, 40, 50]\nprint(nums[::-1])  # [50, 40, 30, 20, 10]`,
    },
    {
      id: 'sub-l-3',
      topic: 'lists',
      subtopic: 'Mutability',
      prompt: 'Why is b = a dangerous when backing up a list, and what should you write instead?',
      mode: 'explanation',
      requiredKeywords: ['copy', 'same'],
      modelAnswer:
        'b = a makes both variables point to the same list object in memory (aliasing), so mutating b changes a. Use b = a.copy() or b = a[:] instead.',
      theorySummary:
        'Lists are mutable reference objects. Direct variable assignment copies the reference, whereas .copy() or [:] allocates a new independent list.',
      supportiveExample: `a = [1, 2, 3]\nb = a.copy()\nb.append(4)\nprint(a, b)  # [1, 2, 3] [1, 2, 3, 4]`,
    },
  ],
};

export const GAME_CHALLENGES: Record<TopicId, GameChallenge[]> = {
  types: [
    {
      id: 'gt-1',
      topic: 'types',
      title: 'Inspect the Float Type',
      instruction: 'Complete the print statement so Python prints the data type of price.',
      codeBefore: 'price = 19.99',
      codeAfter: '',
      placeholder: 'print(type(price))',
      acceptedAnswers: ['print(type(price))'],
      tokenHints: ['print(', 'type(', 'price', ')'],
      expectedOutput: "<class 'float'>",
      hint: 'Wrap price inside type(), then pass it to print().',
    },
    {
      id: 'gt-2',
      topic: 'types',
      title: 'Convert Text to Integer',
      instruction: 'Convert the string "42" into an integer so adding 8 produces 50.',
      codeBefore: 'raw = "42"\ntotal = ____ + 8',
      codeAfter: 'print(total)',
      placeholder: 'int(raw)',
      acceptedAnswers: ['int(raw)', 'int("42")', "int('42')"],
      tokenHints: ['int(raw)', 'float(raw)', 'str(raw)'],
      expectedOutput: '50',
      hint: 'Use the int() constructor on raw.',
    },
    {
      id: 'gt-3',
      topic: 'types',
      title: 'Create a Dictionary Entry',
      instruction: 'Complete the dictionary literal so user["role"] prints "student".',
      codeBefore: 'user = {"name": "Maya", ____}',
      codeAfter: 'print(user["role"])',
      placeholder: '"role": "student"',
      acceptedAnswers: ['"role": "student"', "'role': 'student'", '"role": \'student\'', '\'role\': "student"'],
      tokenHints: ['"role": "student"', '"role" = "student"', 'role: student'],
      expectedOutput: 'student',
      hint: 'Dictionary pairs use a colon between key and value: "key": "value".',
    },
    {
      id: 'gt-4',
      topic: 'types',
      title: 'Deduplicate with a Set',
      instruction: 'Convert the list of tags into a set so duplicate entries are removed.',
      codeBefore: 'tags = ["py", "code", "py"]\nunique = ____',
      codeAfter: 'print(len(unique))',
      placeholder: 'set(tags)',
      acceptedAnswers: ['set(tags)'],
      tokenHints: ['set(tags)', 'tuple(tags)', 'list(tags)'],
      expectedOutput: '2',
      hint: 'Pass tags into set() to keep only unique items.',
    },
  ],
  lists: [
    {
      id: 'gl-1',
      topic: 'lists',
      title: 'Grab the Last Element',
      instruction: 'Use negative indexing to print the last city in the list.',
      codeBefore: 'cities = ["Tokyo", "Cairo", "Lima"]',
      codeAfter: '',
      placeholder: 'print(cities[-1])',
      acceptedAnswers: ['print(cities[-1])', 'print(cities[2])'],
      tokenHints: ['print(', 'cities[-1]', 'cities[0]', ')'],
      expectedOutput: 'Lima',
      hint: 'Negative index -1 always targets the last item.',
    },
    {
      id: 'gl-2',
      topic: 'lists',
      title: 'Extract the Middle Slice',
      instruction: 'Slice nums so it outputs [20, 30].',
      codeBefore: 'nums = [10, 20, 30, 40]\nmiddle = ____',
      codeAfter: 'print(middle)',
      placeholder: 'nums[1:3]',
      acceptedAnswers: ['nums[1:3]', 'nums[1:-1]'],
      tokenHints: ['nums[1:3]', 'nums[1:2]', 'nums[0:2]'],
      expectedOutput: '[20, 30]',
      hint: 'Start at index 1 and stop right before index 3.',
    },
    {
      id: 'gl-3',
      topic: 'lists',
      title: 'Append to the Queue',
      instruction: 'Add "David" to the end of the queue list.',
      codeBefore: 'queue = ["Ada", "Lin"]',
      codeAfter: 'print(queue)',
      placeholder: 'queue.append("David")',
      acceptedAnswers: ['queue.append("David")', "queue.append('David')"],
      tokenHints: ['queue.append("David")', 'queue.insert(0, "David")', 'queue.add("David")'],
      expectedOutput: "['Ada', 'Lin', 'David']",
      hint: 'Use the .append() method on queue.',
    },
    {
      id: 'gl-4',
      topic: 'lists',
      title: 'Mutate an Element in Place',
      instruction: 'Replace the second element (20) with 99.',
      codeBefore: 'scores = [10, 20, 30]',
      codeAfter: 'print(scores)',
      placeholder: 'scores[1] = 99',
      acceptedAnswers: ['scores[1] = 99', 'scores[-2] = 99'],
      tokenHints: ['scores[1] = 99', 'scores[2] = 99', 'scores[0] = 99'],
      expectedOutput: '[10, 99, 30]',
      hint: 'Remember Python is zero-indexed, so the second element is at index 1.',
    },
  ],
};

export const PLAYGROUND_PRESETS: Record<TopicId, PlaygroundPreset[]> = {
  types: [
    {
      id: 'pt-1',
      title: 'Inspect Core Types',
      description: 'Explore int, float, str, bool, and complex values.',
      code: `age = 25
price = 19.95
language = "Python"
is_active = True
wave = 2 + 3j

print("age:", age, type(age))
print("price:", price, type(price))
print("language:", language, type(language))
print("is_active:", is_active, type(is_active))
print("wave:", wave, type(wave))`,
    },
    {
      id: 'pt-2',
      title: 'Compare Collections',
      description: 'See how list, tuple, set, and dict behave side by side.',
      code: `my_list = [1, 2, 2, 3]
my_tuple = (1, 2, 3)
my_set = {1, 2, 2, 3}
my_dict = {"name": "Ada", "level": 5}

print("List (allows duplicates):", my_list)
print("Set (unique only):", my_set)
print("Tuple:", my_tuple, type(my_tuple))
print("Dict lookup:", my_dict["name"])`,
    },
    {
      id: 'pt-3',
      title: 'Type Casting Lab',
      description: 'Convert between strings, integers, floats, and booleans.',
      code: `text_num = "42"
whole = int(text_num)
decimal = float(whole)

print(whole + 8)
print(decimal / 4)
print(bool(""), bool("Python"))`,
    },
  ],
  lists: [
    {
      id: 'pl-1',
      title: 'Indexing & Slicing',
      description: 'Test zero-based indices, negative indices, and slices.',
      code: `numbers = [10, 20, 30, 40, 50]

print("First:", numbers[0])
print("Last:", numbers[-1])
print("Middle slice [1:4]:", numbers[1:4])
print("Reversed [::-1]:", numbers[::-1])`,
    },
    {
      id: 'pl-2',
      title: 'List Methods in Action',
      description: 'Practice append, insert, remove, pop, and sort.',
      code: `items = [30, 10, 20]
items.append(40)
items.insert(1, 15)
print("After append & insert:", items)

items.remove(20)
last = items.pop()
items.sort()

print("Removed last:", last)
print("Sorted result:", items)`,
    },
    {
      id: 'pl-3',
      title: 'Loops & Comprehensions',
      description: 'Transform lists dynamically with for loops and comprehensions.',
      code: `scores = [65, 82, 91, 74, 95]
passing = [s for s in scores if s >= 80]

print("All scores:", scores)
print("Honor scores:", passing)
print("Highest:", max(scores), "Average:", sum(scores) / len(scores))`,
    },
  ],
};
