build:
	rm 11-tts sea-prep.blob
	pnpm run build
	node --experimental-sea-config sea-config.json
	cp ../node-v22.11.0-linux-x64/bin/node 11-tts
	npx postject 11-tts NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --overwrite
