getAccelsCount = function() {
      var lens = BatchAccels.find().map(function (x) {
              return JSON.parse(x.accelsJson).length;
          });
      if (lens.length === 0) {
          return 0;
      }
      return lens.reduce(function (a, b) {return a + b})
};
