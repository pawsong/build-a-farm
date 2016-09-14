const cwise = require('cwise');

export const searchForNearestVoxel1 = cwise({
  args: ['array', 'scalar', 'scalar', 'scalar', 'index'],
  pre: function () {
    this.squaredDistance = Infinity;
  },
  body: function(val, px, pz, vid1, index) {
    if (val === vid1) {
      var dx = px - index[0];
      var dz = pz - index[2];
      var squaredDistance = dx * dx + dz * dz;
      if (squaredDistance < this.squaredDistance) {
        this.squaredDistance = squaredDistance;
        this.val = val;
        this.x = index[0];
        this.z = index[2];
      }
    }
  },
  post: function () {
    if (!this.val) return null;
    return [this.val, this.x, this.z];
  },
});

export const searchForNearestVoxel7 = cwise({
  args: ['array', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'index'],
  pre: function () {
    this.squaredDistance = Infinity;
  },
  body: function(val, px, pz, vid1, vid2, vid3, vid4, vid5, vid6, vid7, index) {
    if (
         val === vid1
      || val === vid2
      || val === vid3
      || val === vid4
      || val === vid5
      || val === vid6
      || val === vid7
    ) {
      var dx = px - index[0];
      var dz = pz - index[2];
      var squaredDistance = dx * dx + dz * dz;
      if (squaredDistance < this.squaredDistance) {
        this.squaredDistance = squaredDistance;
        this.val = val;
        this.x = index[0];
        this.z = index[2];
      }
    }
  },
  post: function () {
    if (!this.val) return null;
    return [this.val, this.x, this.z];
  },
});
