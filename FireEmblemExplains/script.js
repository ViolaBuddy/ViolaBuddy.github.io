/** CLASSES AND REPEATED-USE FUNCTIONS **/

/** a class that represents an instance of an interactive pure function
 * target_name_options is the id of the dialogue box td as a string (including the # sign)
 * target_name_answers: td where responses go
 * target_name_reset: reset button
 * questions_list is the list of options, as an array of strings
 * answers_list is list of answers, correlated with the questions_list by index
 */
function InteractiveFunction(target_name_options, target_name_answers, target_name_reset, questions_list, answers_list){
  var target_answers = d3.select(target_name_answers);
  d3.select(target_name_options).html("")
  target_answers.html("");

  populateKiranDialogueOptions(target_name_options, questions_list,
    function(d, i){
        var the_text = answers_list[i];
        target_answers.html(the_text);
    });

  d3.select(target_name_reset).on("click", function(){
    target_answers.html("&nbsp;");
  });
}

/** a class that represents an instance of an interactive pure function
 * target_name_options is the id of the input box as a string (including the # sign)
 * target_name_answers: td where responses go
 * target_name_reset: reset button
 * conversion_function is the function that takes in a number and returns a number
 */
function InteractiveNumberFunction(target_name_input, target_name_answers, target_name_reset, conversion_function){
  var target_answers = d3.select(target_name_answers);
  d3.select(target_name_options).html("")
  target_answers.html("");

  populateKiranDialogueOptions(target_name_options, questions_list,
    function(d, i){
        var the_text = answers_list[i];
        target_answers.html(the_text);
    });

  d3.select(target_name_reset).on("click", function(){
    target_answers.html("&nbsp;");
  });
}

/** returns whether or not there are duplicate elements in the array */
function hasDuplicates(array){
  //TODO: check compatibility issues with Set. Or just wait until it's fully adopted by everyone.

  return (new Set(array)).size !== array.length;
}

/** for adding options to Kiran's dialogue box
 * target_name is the id of the dialogue box (including the # sign) as a string
 * questions_list is the list of options, as an array of strings
 * on_click is a function to be executed on the button's click */
function populateKiranDialogueOptions(target_name, questions_list, on_click) {
  var all_buttons = d3.select(target_name)
    .selectAll("g")
    .data(questions_list)
    .enter()
    .append("g");

  all_buttons.append("button")
    .html(function(d){return d;})
    .on("click", on_click);
  all_buttons.append("br");
}

/** MAIN AND SINGLE-USE FUNCTIONS **/
/** code for each interactive div **/
// separated into one-time use functions for variable scoping reasons

function interactive_1() {
  var mist_responses = d3.select("#Mist_responses_interactive1");
  var questions_list = ['"What do you think about Ike?"', '"What do you think about Soren?"', '"What do you think about Boyd?"'];

  var all_mist_responses_list = 
      [["Ike? He's always been a great brother to me.", "Didn't I just tell you what I think about Ike? I think he's a great brother.", "Why do you keep asking me about my opinion of Ike?"],
      ["Soren's a bit grumpy, but he's really an okay guy once you get to know him.", "As I just said, Soren's not as bad once you get past his surly personality.", "Look, if you really want to know more about Soren, you should really just go talk to Ike. He knows Soren better than anyone else."],
      ["Boyd is just such a dolt.", "When I say \"dolt,\" I mean that Boyd can just be so frustrating to deal with sometimes.", "I know you keep asking about Boyd, but like, what else can I really say about him?"]
      ];
  var curr_mist_state = [0,0,0];

  populateKiranDialogueOptions("#Kiran_options_interactive1", questions_list,
    function(d, i){
      var the_text = all_mist_responses_list[i][curr_mist_state[i]];
      if(curr_mist_state[i] <= 1) {
        curr_mist_state[i]++;
      }
      mist_responses.html(the_text);
    });

  d3.select("#reset_interactive1").on("click", function(){
    curr_mist_state = [0,0,0];
    mist_responses.html("&nbsp;");
  });
}

function interactive_2() {
  var questions_list = ['"What do you think about Ike?"', '"What do you think about Soren?"', '"What do you think about Boyd?"'];
  var all_mist_responses_list = ["Ike? I like him.", "Soren? I like him.", "Boyd? He's a dolt."];

  new InteractiveFunction("#Kiran_options_interactive2", "#Mist_responses_interactive2", "#reset_interactive2",
    questions_list, all_mist_responses_list);
};

function interactive_3() {
  var DEFAULT_QUESTION = "Who are you?";
  var DEFAULT_RESPONSE = "I am a replica.";

  var questions_list = ["What do you think of Ike?", "What do you think of Soren?", "What do you think of Boyd?"];
  var responses_list = ["I like Ike.", "Soren's cool.", "Boyd's a dolt."];

  function change_questions(i, newContent) {
    questions_list[i] = newContent;
    d3.selectAll("#interactive3_equation_set_2 .interactive_3_range_input_questions")
      .data(questions_list)
      .text(function(_, i){ return questions_list[i]; });

    /*d3.selectAll("#Kiran_options_interactive3 .interactive_3_input_button")
      .data(questions_list)
      .text(function(_, i){ return questions_list[i]; });*/
  }
  function change_responses(i, newContent) {
    responses_list[i] = newContent;
  }
  function add_questions() {
    questions_list.push(DEFAULT_QUESTION);
    responses_list.push(DEFAULT_RESPONSE);

    var domain_input = d3.select("#interactive3_equation_set_1").selectAll("#interactive3_equation_set_1>span")
      .data(questions_list).enter();
    generate_domain_input(domain_input);
    var range_input = d3.select("#interactive3_equation_set_2").selectAll("#interactive3_equation_set_2>span")
      .data(responses_list).enter();
    generate_range_input(range_input);
  }
  function remove_questions(i, newContent) {
    console.log(newContent);
    questions_list[i] = newContent;
    //TODO: exit
  }

  function generate_domain_input(domain_input){
    var domain_input_span = domain_input.append("span");

    domain_input_span.append("span").text("\"");
    domain_input_span.append("span")
      .text(function(d){return d;})
      .attr("contenteditable","true")
      .on("input", function(d, i){ change_questions(i, this.textContent); });
    domain_input_span.append("span").text(function(_, i){
      if (i === questions_list.length - 1) {
        // last element
        return "\" ";
      } else {
        return "\", "
      }
    });
  }
  function generate_range_input(range_input){ //range_input is the selection of the container with data already attached
    var range_input_span = range_input.append("span");
    range_input_span.html("");
    range_input_span.append("br");
    range_input_span.append("img").attr("src", "img/Odin_head.png");
    range_input_span.append("span").text("(\"");
    range_input_span.append("span")
      .classed("interactive_3_range_input_questions", true)
      .text(function(_, i){ return questions_list[i]; });
    range_input_span.append("span").text("\") = \"");
    range_input_span.append("span")
      .classed("interactive_3_range_input_responses", true)
      .text(function(_, i){ return responses_list[i]; })
      .attr("contenteditable","true")
      .on("input", function(d, i){ change_responses(i, this.textContent); });
    range_input_span.append("span").text("\"");
  }
  function generate_button_input(button_input) {
    var button_input_g = button_input.append("g");

    button_input_g.append("button")
      .classed("interactive_3_input_button", true)
      .text(
        function(d){
          return d;
        }
      ).on("click",
        function(d, i){
          var the_text = responses_list[i];
          if (true){
            d3.select("#Odin_responses_interactive3").html(the_text);
          } else {
            asdf();
          }
        }
      );
    button_input_g.append("br");
  }

  var domain_input = d3.select("#interactive3_equation_set_1").selectAll("#interactive3_equation_set_1>span")
    .data(questions_list).enter();
  generate_domain_input(domain_input);
  var range_input = d3.select("#interactive3_equation_set_2").selectAll("#interactive3_equation_set_2>span")
    .data(responses_list).enter();
  generate_range_input(range_input);

  d3.select("#interactive3_add").on("click", add_questions);

  d3.select("#interactive3_go_button").on("click", function(){
    if(hasDuplicates(questions_list)){
      //create alert
      //TODO: a less intrusive alert

      alert('Functions can\'t have the same input defined twice!');
    } else {
      new InteractiveFunction("#Kiran_options_interactive3", "#Odin_responses_interactive3", "#reset_interactive3", questions_list, responses_list);
    }
  });

};

function interactive_4() {
  /*new InteractiveFunction("#Kiran_options_interactive2", "#Mist_responses_interactive2", "#reset_interactive2",
    questions_list, all_mist_responses_list);*/
};


interactive_1();
interactive_2();
interactive_3();
interactive_4();