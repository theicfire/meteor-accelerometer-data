Npm.depends({
    'node-gcm': '0.9.15'
});

Package.on_use(function (api) {
    api.add_files('server'); // Or 'client', or ['server', 'client']
});
