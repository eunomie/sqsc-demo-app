$(document).ready(function() {
  // var $loader = $('#loader').show();
  let mandelData = {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    width: 900,
    height: 600,
    iter: 100000
  };

  // TO TEST
  // function loadImg() {
  //   $('mandelImg').hide();
  //   // $loader.show();
  //   $.get('/image', mandelData)
  //     .done(function(data) {
  //       $('#img_results').prepend('<img id="theImg" src="'+data+'" />')
  //       // $loader.hide(500);
  //     })
  //     .fail(function() {
  //       // $loader.hide(500);
  //     });
  // }
  //
  // loadImg();
  // END !! TO TEST

  // $('body').on('click', '#img_result', function(e) {
  //
  //   var offX = ((e.offsetX / mandelData.width) - 0.5) * 2.0,
  //     offY = ((e.offsetY / mandelData.height) - 0.5) * 2.0,
  //     newX = (offX * mandelData.scaleX) + mandelData.x,
  //     newY = (offY * mandelData.scaleY) + mandelData.y;
  //   $.extend(mandelData, {
  //     x: newX,
  //     y: newY,
  //     scaleX: mandelData.scaleX * 0.5,
  //     scaleY: mandelData.scaleY * 0.5
  //   });

    // TODO
    // loadImg();
  // });

  let ctx = document.getElementById('result').getContext('2d');
  let start, end;
  let stats;
  let sessionResults = [];
  let params = {};

  $('button').bind("click", function() {
    $('button').attr('disabled', 'disabled');
    $('.error').addClass('hidden');
    stats = initStats();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 900, 600);

    params.precision = $('input#precision').val();
    params.stepX = $('input#stepX').val();
    params.stepY = $('input#stepY').val();

    $.ajax({
      method: 'POST',
      url: '/launch',
      data: params,
      error: (req, status, error) => {
        $('.error').removeClass('hidden');
        $('.error').text('Remote server not responding');
        $('button').removeAttr('disabled');
      }
    });
  });
  
  const socket = io();

  socket.on('compute_task_created', () => {
    if (stats.computeTaskCreated === 0) {
      stats.startTime = new Date().getTime();
      $('#stats').removeClass('hidden');
      $('#containersStats tbody').empty();
    }
    stats.computeTaskCreated++;
    $('#computeTaskCount').text(stats.computeTaskCreated);
    stats.computeTaskRemaining++;
    $('#computeTaskRemaining').text(stats.computeTaskRemaining);
  });

  socket.on('compute_task_result', function(data) {
    let image = new Image();
    image.src = data.result;

    image.onload = () => ctx.drawImage(image, 0, 0, data.stepX, data.stepY, data.step, 0, data.stepX, data.stepY);
  
    if (!stats.containers[data.container]) {
      stats.containers[data.container] = 0;
    }
    stats.containers[data.container]++;
    updateContainersStats();

    stats.computeTaskRemaining--;
    $('#computeTaskRemaining').text(stats.computeTaskRemaining);

    stats.computeTime = new Date().getTime() - stats.startTime;
    $('.time').text(`${stats.computeTime} ms`);

    
    if (stats.computeTaskRemaining === 0) {
      $('button').removeAttr('disabled');
      
      stats.computeSpeed = 1000 * 900 * 600 / stats.computeTime;
      $('#computeSpeed').text(stats.computeSpeed.toLocaleString('fr', {maximumFractionDigits: 0}));

      addNewResult(stats);
    }
  });

  function initStats() {
    return {
      startTime: null,
      precision: null,
      computeTaskCreated: 0,
      computeTaskRemaining: 0,
      computeTime: 0,
      containers: {},
      computeSpeed: 0
    };
  }

  function updateContainersStats() {
    $('#containersStats tbody').empty();
    Object.entries(stats.containers).forEach(([containerId, count]) => {
      $('#containersStats tbody').append(`
        <tr>
          <td>${containerId}</td>
          <td>${count}</td>
        </tr>`)
    });
  }

  function addNewResult(stats) {
    sessionResults.push(stats);
    $('#sessionResults').removeClass('hidden');
    $('table#results tbody').prepend(`
        <tr>
          <td>${new Date(stats.startTime).toLocaleTimeString()}</td>
          <td>${params.precision}</td>
          <td>${stats.computeTaskCreated}</td>
          <td>${Object.entries(stats.containers).length}</td>
          <td>${stats.computeTime}</td>
          <td>${stats.computeSpeed.toLocaleString('fr', {maximumFractionDigits: 0})}</td>
        </tr>`);
  }
});
