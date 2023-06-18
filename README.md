<h1 align="center">HOW TO IMPLEMENT A DEEPLEARNING MODEL INTO SERVER</h1>

<h2 align="center">DETECTING NINE DASH LINE IN IMAGES OR VIDEO</h2>

<p>Code structure</p>
<table>
  <thead>
    <tr>
      <th scope="col">folder</th>
      <th scope="col">description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>config</td>
      <td>Config database, http request and view engine</td>
    </tr>
    <tr>
      <td>controller</td>
      <td>Handle get and post mehthod</td>
    </tr>
    <tr>
      <td>middleware</td>
      <td>Express middleware</td>
    </tr>
    <tr>
      <td>model</td>
      <td>Schema</td>
    </tr>
    <tr>
      <td>route</td>
      <td>Routing and define endpoint</td>
    </tr>
    <tr>
      <td>service</td>
      <td>All deep learning logic go here</td>
    </tr>
    <tr>
      <td>views</td>
      <td>Create temporary UI</td>
    </tr>
  </tbody>
</table>

<p>Setup guide</p>
<span>OS</span>
<ul>
  <li>Window</li>
  <ul>
    <li>docker build -t server .</li>
    <li>
      change this path: <b>/home/long1100/temp</b> in `docker-compose.yaml/volumes section` to absolute path to the folder you just clone,
      because in window can't run canvas and sharp library at the same time. 
    </li>
    <li>remove volumes section in image mongo if you don't need it</li>
    <li>docker-compose up</li>
  </ul>
  <li>Linux or Mac</li>
  <ul>
    <li>npm install</li>
  </ul>
</ul>
